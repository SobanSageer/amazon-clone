import type { RetrievedProduct } from "@/lib/assistant/retrieval";

// Deterministic screening, run before any model call. Two jobs:
//   1. Refuse prompt-probing and clearly non-shopping questions outright.
//   2. Require the question to actually overlap the retrieved rows, so a match on
//      stray description words ("system", "pro") can't pull the model off-topic.
// Cheaper and more predictable than asking a model to police itself.

const REFUSAL =
  "I can only help with products in the Marlo catalogue. Ask me about an item, a category, or what fits a budget and I'll take a look.";

// Attempts to extract instructions, configuration or credentials.
const PROBING =
  /\b(system prompt|your (instructions|prompt|rules|config)|ignore (the|your|all|previous)|disregard (the|your|all|previous)|jailbreak|prompt inject|developer mode|act as|pretend to be|you are now|api[_ -]?key|token|password|env(ironment)? var)/i;

// Common non-shopping intents people try on a store bot.
const OFF_TOPIC =
  /\b(who is|who was|capital of|president|prime minister|weather|news|translate|write (me )?(a |an )?(poem|essay|code|script|story)|python|javascript|sql query|solve|calculate|math|recipe for|diagnose|symptom|medical|legal advice|stock price|bitcoin|crypto)\b/i;

export type Screen = { allow: true } | { allow: false; reply: string };

export function screenQuestion(message: string): Screen {
  if (PROBING.test(message) || OFF_TOPIC.test(message)) return { allow: false, reply: REFUSAL };
  return { allow: true };
}

const WORD_STOP = new Set([
  "the", "and", "for", "are", "any", "you", "can", "get", "has", "have", "what", "which", "that",
  "this", "with", "from", "about", "under", "over", "best", "good", "show", "tell", "give", "please",
  "need", "want", "looking", "find", "something", "there", "your", "does", "do", "is", "it", "me", "my",
]);

// Shopping vocabulary is enough on its own — "what's cheapest?" is a fair question
// even when no single word matches a product title.
const SHOPPING_INTENT =
  /\b(price|cost|cheap|cheapest|budget|afford|expensive|buy|order|cart|checkout|deliver|delivery|shipping|stock|available|rating|rated|review|recommend|compare|gift|size|colour|color|brand|warranty|return)\b/i;

export function isRelevant(message: string, products: RetrievedProduct[]) {
  if (SHOPPING_INTENT.test(message)) return true;
  const tokens = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !WORD_STOP.has(t));
  if (!tokens.length) return false;
  return products.some((p) => {
    const haystack = `${p.title} ${p.brand ?? ""} ${p.category}`.toLowerCase();
    return tokens.some((t) => haystack.includes(t));
  });
}

export { REFUSAL };
