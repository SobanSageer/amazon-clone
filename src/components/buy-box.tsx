"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { addToCartAction, buyNowAction, type AddToCartState } from "@/app/actions/cart";
import { announceCartCount } from "@/lib/cart-events";
import { MAX_QTY_PER_ITEM } from "@/lib/pricing";

function SubmitButtons({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState<"add" | "buy">("add");
  const busyAdd = pending && clicked === "add";
  const busyBuy = pending && clicked === "buy";
  return (
    <div className="flex flex-col gap-2">
      <button
        type="submit"
        onClick={() => setClicked("add")}
        disabled={disabled || pending}
        className="flex h-9 items-center justify-center gap-2 rounded-full border border-m-accent bg-m-accent text-[13px] font-medium text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-accent disabled:cursor-not-allowed disabled:opacity-60 hover:bg-m-accent-hover"
      >
        {busyAdd && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Add to Cart
      </button>
      <button
        type="submit"
        formAction={buyNowAction}
        onClick={() => setClicked("buy")}
        disabled={disabled || pending}
        className="flex h-9 items-center justify-center gap-2 rounded-full border border-m-border bg-m-surface text-[13px] font-medium text-m-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-accent disabled:cursor-not-allowed disabled:opacity-60 hover:bg-m-muted"
      >
        {busyBuy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Buy Now
      </button>
    </div>
  );
}

export function BuyBoxForm({ productId, stock }: { productId: string; stock: number }) {
  const [state, formAction] = useActionState<AddToCartState, FormData>(addToCartAction, { status: "idle" });
  const available = stock > 0;
  const maxQty = Math.min(stock, MAX_QTY_PER_ITEM);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (state.status === "added") {
      announceCartCount(state.count);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={qty} />
      {available && (
        <div className="relative w-fit rounded-lg border border-m-border bg-m-muted shadow-sm focus-within:outline-2 focus-within:outline-m-accent hover:bg-m-hover">
          <span aria-hidden className="flex h-8 items-center gap-1 px-2.5 text-[13px] text-m-ink">
            Quantity: {qty}
            <ChevronDown className="size-3.5" />
          </span>
          <select
            aria-label="Quantity"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
          >
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}
      <SubmitButtons disabled={!available} />
      <div aria-live="polite" className="text-sm">
        {state.status === "added" && (
          <div className="flex flex-col gap-1 rounded-lg bg-m-success-bg p-3 text-emerald-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="size-4" aria-hidden /> Added to cart
            </p>
            {state.note && <p>{state.note}</p>}
            <Link href="/cart" className="font-medium text-m-accent-text underline">
              Go to cart ({state.count} {state.count === 1 ? "item" : "items"})
            </Link>
          </div>
        )}
        {state.status === "error" && <p className="rounded-lg bg-m-error-bg p-3 text-red-800">{state.message}</p>}
      </div>
    </form>
  );
}
