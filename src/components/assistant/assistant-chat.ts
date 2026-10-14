export const ASSISTANT_NAME = "Milo";
export const MAX_INPUT_CHARS = 500;
export const STORAGE_KEY = "marlo:milo:chat";

export type ProductCard = {
  slug: string;
  title: string;
  price: number;
  rating: number;
  ratingCount: number;
  stock: number;
  thumbnail: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: ProductCard[];
  failed?: boolean;
};

export const STARTERS = [
  "What headphones do you have?",
  "Something for the kitchen under $20",
  "Best rated phone you sell",
];

export const HINTS = [
  "Looking for something?",
  "Ask me about any product",
  "I can compare two products",
  "Need a gift idea?",
];

export function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Message[]).slice(-40) : [];
  } catch {
    return [];
  }
}

export function saveHistory(messages: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    // private mode or full storage — chat still works for this session
  }
}

// Streams NDJSON from the route. Products arrive first, then text chunks.
export async function streamReply(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  on: { products: (p: ProductCard[]) => void; text: (chunk: string) => void; error: (msg: string) => void },
  signal?: AbortSignal,
) {
  let res: Response;
  try {
    res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
      signal,
    });
  } catch {
    on.error("I can't reach the assistant right now. Please try again.");
    return;
  }

  if (!res.ok || !res.body) {
    const fallback = "Something went wrong on my side. Please try again.";
    const msg = await res
      .json()
      .then((d: { error?: string }) => d.error ?? fallback)
      .catch(() => fallback);
    on.error(msg);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const ln of lines) {
        if (!ln.trim()) continue;
        try {
          const evt = JSON.parse(ln);
          if (evt.type === "products") on.products(evt.products ?? []);
          else if (evt.type === "text") on.text(evt.v ?? "");
          else if (evt.type === "error") on.error(evt.message ?? "Something went wrong.");
        } catch {
          // partial or malformed line — skip it rather than breaking the chat
        }
      }
    }
  } catch {
    on.error("The connection dropped mid-answer. Please try again.");
  }
}

// Splits "text [label](/product/slug) more" into renderable pieces.
export function parseLinks(text: string) {
  const parts: ({ type: "text"; value: string } | { type: "link"; label: string; href: string })[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "link", label: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

// Only show cards for products the reply actually named.
export function mentionedProducts(text: string, products: ProductCard[] | undefined) {
  if (!products?.length) return [];
  return products.filter((p) => text.includes(`/product/${p.slug}`)).slice(0, 3);
}
