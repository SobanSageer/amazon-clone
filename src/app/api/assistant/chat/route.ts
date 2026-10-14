import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import {
  buildUserMessage,
  HISTORY_TURNS,
  MAX_INPUT_CHARS,
  noMatchReply,
  SYSTEM_INSTRUCTIONS,
  type ChatTurn,
} from "@/lib/assistant/prompt";
import { retrieveProducts, topCategories, type RetrievedProduct } from "@/lib/assistant/retrieval";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Temporary free-tier Groq key: set GROQ_API_KEY in the Vercel project and rotate it
// whenever it leaks. Deliberately not hardcoded — this repo is public, and a committed key
// is scraped within minutes.
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Groq retires model ids periodically; fall through the list if one is rejected.
const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-20b"];

const SESSION_COOKIE = "assistant_session";
const RATE_LIMIT = { windowMs: 60_000, max: 10 };
const hits = new Map<string, number[]>();

// Per-instance limiter: enough to stop one tab hammering the key. Serverless instances
// don't share it, so it's a courtesy guard, not a security boundary.
function rateLimited(sessionId: string) {
  const now = Date.now();
  const recent = (hits.get(sessionId) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(sessionId, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

function line(obj: unknown) {
  return new TextEncoder().encode(JSON.stringify(obj) + "\n");
}

function cardFor(p: RetrievedProduct) {
  return {
    slug: p.slug,
    title: p.title,
    price: p.price,
    rating: p.rating,
    ratingCount: p.ratingCount,
    stock: p.stock,
    thumbnail: p.thumbnail,
  };
}

export async function POST(request: Request) {
  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({ error: "Ask me something about the catalogue." }, { status: 400 });
  if (message.length > MAX_INPUT_CHARS) {
    return Response.json({ error: `Please keep questions under ${MAX_INPUT_CHARS} characters.` }, { status: 400 });
  }

  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .filter((t): t is ChatTurn =>
          Boolean(t) && typeof t === "object" && typeof (t as ChatTurn).content === "string" &&
          ((t as ChatTurn).role === "user" || (t as ChatTurn).role === "assistant"),
        )
        .slice(-HISTORY_TURNS)
        .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_INPUT_CHARS) }))
    : [];

  const jar = await cookies();
  let sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    sessionId = randomUUID();
    jar.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
  if (rateLimited(sessionId)) {
    return Response.json({ error: "You're sending messages quite fast — give me a few seconds." }, { status: 429 });
  }

  let products: RetrievedProduct[] = [];
  try {
    products = await retrieveProducts(message);
  } catch (err) {
    console.error("[assistant] retrieval failed", err);
    return Response.json({ error: "I couldn't reach the catalogue just now. Please try again." }, { status: 503 });
  }

  // Nothing matched: answer deterministically instead of asking the model to improvise.
  if (products.length === 0) {
    const categories = await topCategories().catch(() => []);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(line({ type: "products", products: [] }));
        controller.enqueue(line({ type: "text", v: noMatchReply(categories) }));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Cards go out before the model runs, so matches still render if it fails.
      controller.enqueue(line({ type: "products", products: products.map(cardFor) }));
      if (!GROQ_API_KEY) {
        controller.enqueue(line({ type: "error", message: "The assistant isn't configured yet (missing GROQ_API_KEY)." }));
        controller.close();
        return;
      }
      let res: Response | null = null;
      let lastError = "";
      try {
        for (const model of MODELS) {
          const attempt = await fetch(GROQ_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              temperature: 0.2,
              max_tokens: 500,
              stream: true,
              messages: [
                { role: "system", content: SYSTEM_INSTRUCTIONS },
                ...history.map((t) => ({ role: t.role, content: t.content })),
                { role: "user", content: buildUserMessage(message, products) },
              ],
            }),
          });
          if (attempt.ok && attempt.body) {
            res = attempt;
            break;
          }
          const detail = await attempt.text().catch(() => "");
          lastError = `${attempt.status} ${detail.slice(0, 200)}`;
          console.error("[assistant] groq rejected the call", model, lastError);
          // Auth and quota problems won't be fixed by trying another model.
          if (attempt.status === 401 || attempt.status === 403 || attempt.status === 429) break;
        }

        if (!res || !res.body) {
          controller.enqueue(
            line({ type: "error", message: `I couldn't reach the model. (Groq: ${lastError || "no response"})` }),
          );
          controller.close();
          return;
        }

        // Groq streams OpenAI-style SSE: "data: {json}" lines, ending with "data: [DONE]".
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const raw of lines) {
            const payload = raw.trim();
            if (!payload.startsWith("data:")) continue;
            const data = payload.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const token = JSON.parse(data)?.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(line({ type: "text", v: token }));
            } catch {
              // partial frame — the next chunk completes it
            }
          }
        }
      } catch (err) {
        console.error("[assistant] model call failed", err);
        controller.enqueue(
          line({ type: "error", message: "I had trouble answering that one. Please try again in a moment." }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
