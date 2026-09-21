"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
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
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-amz-yellow text-sm font-semibold text-zinc-900 hover:bg-amz-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busyAdd && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Add to cart
      </button>
      <button
        type="submit"
        formAction={buyNowAction}
        onClick={() => setClicked("buy")}
        disabled={disabled || pending}
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-amz-orange text-sm font-semibold text-zinc-950 hover:bg-amz-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busyBuy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Buy now
      </button>
    </div>
  );
}

export function BuyBoxForm({ productId, stock }: { productId: string; stock: number }) {
  const [state, formAction] = useActionState<AddToCartState, FormData>(addToCartAction, { status: "idle" });
  const available = stock > 0;
  const maxQty = Math.min(stock, MAX_QTY_PER_ITEM);

  useEffect(() => {
    if (state.status === "added") {
      announceCartCount(state.count);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      {available && (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          Quantity
          <select
            name="quantity"
            defaultValue={1}
            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
      <SubmitButtons disabled={!available} />
      <div aria-live="polite" className="text-sm">
        {state.status === "added" && (
          <div className="flex flex-col gap-1 rounded-lg bg-emerald-50 p-3 text-emerald-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="size-4" aria-hidden /> Added to cart
            </p>
            {state.note && <p>{state.note}</p>}
            <Link href="/cart" className="font-medium text-amz-link underline">
              Go to cart ({state.count} {state.count === 1 ? "item" : "items"})
            </Link>
          </div>
        )}
        {state.status === "error" && <p className="rounded-lg bg-red-50 p-3 text-red-800">{state.message}</p>}
      </div>
    </form>
  );
}
