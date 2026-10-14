import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

// Temporary free-tier Gemini key: set GEMINI_API_KEY in the Vercel project and rotate it
// whenever it leaks. Deliberately not hardcoded — this repo is public, and a committed key
// is scraped within minutes.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const MODEL = "gemini-2.0-flash";

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

  if (!GEMINI_API_KEY) {
    return Response.json(
      { error: "The assistant isn't configured yet (missing GEMINI_API_KEY)." },
      { status: 503 },
    );
  }

  const model = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTIONS,
    generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
  });

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(line({ type: "products", products: products.map(cardFor) }));
      try {
        const result = await model.generateContentStream(buildUserMessage(message, products, history));
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(line({ type: "text", v: text }));
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
