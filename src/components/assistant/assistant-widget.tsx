"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { MiloCharacter } from "@/components/assistant/milo-character";
import {
  ASSISTANT_NAME,
  HINTS,
  loadHistory,
  MAX_INPUT_CHARS,
  type Message,
  type Inline,
  mentionedProducts,
  parseBlocks,
  type ProductCard,
  saveHistory,
  STARTERS,
  streamReply,
} from "@/components/assistant/assistant-chat";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const HINT_MIN_MS = 20_000;
const HINT_MAX_MS = 30_000;

const subscribeNoop = () => () => {};
const GREETED_KEY = "marlo:milo:greeted";
const GREETING = "Hi, I'm Milo. How can I help?";

function Card({ p }: { p: ProductCard }) {
  return (
    <Link
      href={`/product/${p.slug}`}
      className="flex items-center gap-3 rounded-lg border border-m-border bg-m-surface p-2 hover:border-m-accent focus-visible:outline-2 focus-visible:outline-m-accent"
    >
      <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-m-muted">
        <Image src={p.thumbnail} alt="" fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[13px] leading-snug text-m-ink">{p.title}</span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-m-secondary">
          <span className="font-bold text-m-ink">{formatPrice(p.price)}</span>
          <span>★ {p.rating.toFixed(1)}</span>
          {p.stock === 0 && <span className="text-m-deal">Out of stock</span>}
        </span>
      </span>
    </Link>
  );
}

function InlineRun({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "bold")
          return (
            <strong key={i} className="font-bold">
              <InlineRun parts={part.parts} />
            </strong>
          );
        if (part.type === "italic")
          return (
            <em key={i}>
              <InlineRun parts={part.parts} />
            </em>
          );
        if (part.type === "link")
          return (
            <Link key={i} href={part.href} className="font-medium text-m-accent-text underline underline-offset-2">
              {part.label}
            </Link>
          );
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}

function Bubble({ m }: { m: Message }) {
  const cards = mentionedProducts(m.text, m.products);
  if (m.role === "user") {
    return (
      <li className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-m-accent px-3 py-2 text-sm text-white">
          {m.text}
        </p>
      </li>
    );
  }
  return (
    <li className="flex flex-col gap-2">
      <div
        className={cn(
          "flex max-w-[92%] flex-col gap-2 rounded-lg rounded-bl-sm px-3 py-2 text-sm",
          m.failed ? "bg-m-error-bg text-m-ink" : "bg-m-muted text-m-ink",
        )}
      >
        {parseBlocks(m.text).map((block, bi) =>
          block.type === "p" ? (
            <p key={bi}>
              <InlineRun parts={block.inline} />
            </p>
          ) : (
            <ul key={bi} className="flex list-disc flex-col gap-1 pl-4">
              {block.items.map((item, ii) => (
                <li key={ii}>
                  <InlineRun parts={item} />
                </li>
              ))}
            </ul>
          ),
        )}
      </div>
      {cards.length > 0 && (
        <ul className="flex flex-col gap-2">
          {cards.map((p) => (
            <li key={p.slug}>
              <Card p={p} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function AssistantWidget() {
  // false during SSR and hydration, true afterwards — keeps sessionStorage history
  // out of the hydration pass without setting state from an effect.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() =>
    typeof window === "undefined" ? [] : loadHistory(),
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(false);
  const [hintsOff, setHintsOff] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (mounted) saveHistory(messages);
  }, [messages, mounted]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // A standing greeting on arrival, once per session, until opened or dismissed.
  useEffect(() => {
    if (sessionStorage.getItem(GREETED_KEY)) return;
    const t = window.setTimeout(() => setGreeting(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const closeGreeting = useCallback(() => {
    setGreeting(false);
    try {
      sessionStorage.setItem(GREETED_KEY, "1");
    } catch {
      // private mode — it just greets again next load
    }
  }, []);

  // Rotating hint bubble while the panel is closed.
  useEffect(() => {
    if (open || hintsOff || greeting) return;
    let i = Math.floor(Math.random() * HINTS.length);
    const schedule = () =>
      window.setTimeout(
        () => {
          setHint(HINTS[i % HINTS.length]);
          i++;
          hideTimer = window.setTimeout(() => setHint(null), 7000);
          timer = schedule();
        },
        HINT_MIN_MS + Math.random() * (HINT_MAX_MS - HINT_MIN_MS),
      );
    let timer = schedule();
    let hideTimer = 0;
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [open, hintsOff, greeting]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_INPUT_CHARS);
      if (!text || busy) return;
      setHint(null);
      setInput("");
      setBusy(true);

      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.text }));
      const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
      const replyId = crypto.randomUUID();
      setMessages((prev) => [...prev, userMsg, { id: replyId, role: "assistant", text: "" }]);

      const update = (patch: Partial<Message>) =>
        setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, ...patch } : m)));

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let acc = "";
      await streamReply(
        text,
        history,
        {
          products: (p) => update({ products: p }),
          text: (chunk) => {
            acc += chunk;
            update({ text: acc });
          },
          error: (msg) => update({ text: acc ? `${acc}\n\n${msg}` : msg, failed: true }),
        },
        ctrl.signal,
      );
      setBusy(false);
      inputRef.current?.focus();
    },
    [busy, messages],
  );

  // Rendered only after mount so sessionStorage history doesn't trip hydration.
  if (!mounted) return null;

  const lastIsEmptyReply = busy && messages[messages.length - 1]?.text === "";

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2 print:hidden">
        {(greeting || hint) && !open && (
          <div className="order-first mb-3 flex max-w-[15rem] items-start gap-1 rounded-lg rounded-br-sm border border-m-border bg-m-surface px-3 py-2 shadow-md">
            <button
              type="button"
              onClick={() => {
                closeGreeting();
                setOpen(true);
              }}
              className="text-left text-[13px] leading-snug text-m-ink hover:text-m-accent"
            >
              {greeting ? GREETING : hint}
            </button>
            <button
              type="button"
              onClick={() => {
                if (greeting) closeGreeting();
                else {
                  setHint(null);
                  setHintsOff(true);
                }
              }}
              aria-label="Dismiss message"
              className="-mr-1 -mt-1 shrink-0 rounded p-1 text-m-dim hover:text-m-ink focus-visible:outline-2 focus-visible:outline-m-accent"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            closeGreeting();
            setOpen((v) => !v);
          }}
          aria-expanded={open}
          aria-label={open ? `Close ${ASSISTANT_NAME}` : `Open ${ASSISTANT_NAME}, the shopping assistant`}
          className="h-[76px] w-[68px] drop-shadow-[0_6px_14px_rgba(15,95,87,0.25)] transition-transform hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-m-accent sm:h-[88px] sm:w-[78px]"
        >
          <MiloCharacter listening={busy} />
        </button>

      </div>

      {/* Panel: non-modal, so the page stays usable while it's open. */}
      <aside
        role="dialog"
        aria-modal="false"
        aria-label={`${ASSISTANT_NAME}, shopping assistant`}
        hidden={!open}
        className={cn(
          "fixed z-50 flex flex-col border-m-border bg-m-surface shadow-2xl print:hidden",
          // phones: bottom sheet. sm and up: full-height panel from the left.
          "inset-x-0 bottom-0 h-[78vh] rounded-t-2xl border-t",
          // Opens on the same side as Milo.
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-[380px] sm:rounded-none sm:border-l sm:border-t-0",
        )}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-m-border bg-m-accent px-4 py-3 text-white sm:rounded-none">
          <span className="size-8 shrink-0">
            <MiloCharacter />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold leading-tight">{ASSISTANT_NAME}</span>
            <span className="block text-xs text-white/80">Marlo shopping assistant</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="rounded-md p-1.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <ul ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4">
          {messages.length === 0 && (
            <li className="rounded-lg bg-m-muted p-3 text-sm text-m-ink">
              <Sparkles className="mb-1 size-4 text-m-accent" aria-hidden />
              Hi, I&apos;m {ASSISTANT_NAME}. I can only see Marlo&apos;s catalogue, so ask me about products we
              actually stock and I&apos;ll point you at them.
            </li>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}
          {lastIsEmptyReply && (
            <li className="flex gap-1 px-1" aria-label={`${ASSISTANT_NAME} is typing`}>
              <span className="size-2 animate-bounce rounded-full bg-m-dim [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-m-dim [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-m-dim" />
            </li>
          )}
        </ul>

        {messages.length === 0 && (
          <ul className="flex shrink-0 flex-wrap gap-2 px-4 pb-2">
            {STARTERS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-m-border bg-m-surface px-3 py-1.5 text-xs text-m-ink hover:border-m-accent hover:text-m-accent focus-visible:outline-2 focus-visible:outline-m-accent"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex shrink-0 items-end gap-2 border-t border-m-border p-3"
        >
          <label htmlFor="milo-input" className="sr-only">
            Ask {ASSISTANT_NAME} about products
          </label>
          <textarea
            id="milo-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_INPUT_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about any product…"
            className="max-h-28 min-h-9 flex-1 resize-none rounded-lg border border-m-border-strong bg-m-surface px-3 py-2 text-base text-m-ink focus:border-m-accent focus:outline-none focus:ring-2 focus:ring-m-accent/30 sm:text-sm"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-m-accent text-white hover:bg-m-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-accent disabled:opacity-40"
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
        </form>
      </aside>
    </>
  );
}
