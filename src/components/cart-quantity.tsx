"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { setQuantityAction } from "@/app/actions/cart";
import { announceCartCount } from "@/lib/cart-events";

function StepperButtons({ quantity, max, title }: { quantity: number; max: number; title: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="inline-flex h-8 items-center rounded-full border-[3px] border-amz-yellow bg-white">
      <button
        type="submit"
        name="quantity"
        value={quantity - 1}
        disabled={pending}
        aria-label={quantity === 1 ? `Remove ${title} from cart` : `Decrease quantity of ${title}`}
        className="flex size-8 items-center justify-center rounded-full text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-zinc-900"
      >
        {quantity === 1 ? <Trash2 className="size-4" aria-hidden /> : <Minus className="size-4" aria-hidden />}
      </button>
      <span className="flex w-8 justify-center text-sm font-semibold tabular-nums" aria-live="polite">
        {pending ? <Loader2 className="size-4 animate-spin" aria-label="Updating" /> : <span aria-label={`Quantity ${quantity}`}>{quantity}</span>}
      </span>
      <button
        type="submit"
        name="quantity"
        value={quantity + 1}
        disabled={pending || quantity >= max}
        aria-label={`Increase quantity of ${title}`}
        className="flex size-8 items-center justify-center rounded-full text-zinc-800 hover:bg-zinc-100 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-zinc-900"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function CartQuantity({ itemId, quantity, max, title }: { itemId: string; quantity: number; max: number; title: string }) {
  return (
    <form action={setQuantityAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <StepperButtons quantity={quantity} max={max} title={title} />
    </form>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-xs text-amz-link hover:text-amz-link-hover hover:underline disabled:opacity-50">
      Delete
    </button>
  );
}

export function CartRemove({ itemId, title }: { itemId: string; title: string }) {
  return (
    <form action={setQuantityAction} aria-label={`Remove ${title}`}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="quantity" value={0} />
      <RemoveButton />
    </form>
  );
}

export function CartCountSync({ count }: { count: number }) {
  useEffect(() => announceCartCount(count), [count]);
  return null;
}
