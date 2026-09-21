import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, orderTotals } from "@/lib/pricing";

export function OrderSummary({ subtotal, itemCount, children }: {
  subtotal: number;
  itemCount: number;
  children?: React.ReactNode;
}) {
  const t = orderTotals(subtotal);
  const toFree = FREE_SHIPPING_THRESHOLD - subtotal;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-bold text-zinc-900">Order summary</h2>
      {toFree > 0 && subtotal > 0 ? (
        <div className="mt-3">
          <p className="text-sm text-zinc-700">
            Add <strong className="text-zinc-900">{formatPrice(toFree)}</strong> more for free shipping.
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200" aria-hidden>
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(subtotal / FREE_SHIPPING_THRESHOLD) * 100}%` }} />
          </div>
        </div>
      ) : subtotal > 0 ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">Your order qualifies for free shipping.</p>
      ) : null}
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-600">
            Items ({itemCount})
          </dt>
          <dd className="tabular-nums text-zinc-900">{formatPrice(t.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-600">Shipping</dt>
          <dd className="tabular-nums text-zinc-900">{t.shippingFee === 0 ? "Free" : formatPrice(t.shippingFee)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-600">Estimated tax</dt>
          <dd className="tabular-nums text-zinc-900">{formatPrice(t.tax)}</dd>
        </div>
        <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(t.total)}</dd>
        </div>
      </dl>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
