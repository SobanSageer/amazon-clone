"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";
import { addToCartAction, type AddToCartState } from "@/app/actions/cart";
import { announceCartCount } from "@/lib/cart-events";

function Button({ added, title, label }: { added: boolean; title: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${label}: ${title}`}
      className="relative z-10 flex h-8 items-center gap-1.5 rounded-full bg-amz-yellow px-3 text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007185] disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : added ? <Check className="size-3.5" aria-hidden /> : null}
      {added && !pending ? "Added to cart" : label}
    </button>
  );
}

export function CardAddToCart({ productId, title, label = "Add to cart" }: { productId: string; title: string; label?: string }) {
  const [state, action] = useActionState<AddToCartState, FormData>(addToCartAction, { status: "idle" });
  useEffect(() => {
    if (state.status === "added") announceCartCount(state.count);
  }, [state]);
  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={1} />
      <Button added={state.status === "added"} title={title} label={label} />
      <span aria-live="polite" className="sr-only">
        {state.status === "added" ? `${title} added to cart` : state.status === "error" ? state.message : ""}
      </span>
    </form>
  );
}
