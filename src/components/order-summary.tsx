import { formatPrice } from "@/lib/format";
import { SHIPPING_SPEEDS, type orderTotals, type ShippingSpeed } from "@/lib/pricing";

type Totals = ReturnType<typeof orderTotals>;

export function OrderSummary({
  totals,
  itemCount,
  speed,
  state,
  children,
}: {
  totals: Totals;
  itemCount: number;
  speed: ShippingSpeed;
  state: string | null;
  children?: React.ReactNode;
}) {
  const t = totals;
  return (
    <div className="rounded-lg border border-[#d5d9d9] bg-white p-4 sm:p-5">
      {children && <div className="mb-4 border-b border-zinc-200 pb-4">{children}</div>}
      <h2 className="text-lg font-bold text-[#0f1111]">Order Summary</h2>
      <dl className="mt-3 space-y-1.5 text-sm" aria-live="polite">
        <div className="flex justify-between">
          <dt>Items ({itemCount}):</dt>
          <dd className="tabular-nums">{formatPrice(t.subtotal)}</dd>
        </div>
        {t.discount > 0 && (
          <div className="flex justify-between text-[#067d62]">
            <dt>Promotion ({t.promoCode}):</dt>
            <dd className="tabular-nums">−{formatPrice(t.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>{SHIPPING_SPEEDS[speed].label}:</dt>
          <dd className="tabular-nums">{t.shippingFee === 0 ? "FREE" : formatPrice(t.shippingFee)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>
            Estimated tax{t.taxRate !== null && state ? ` (${state} ${+(t.taxRate * 100).toFixed(3)}%)` : ""}:
          </dt>
          <dd className="tabular-nums">{t.taxRate === null ? "—" : formatPrice(t.tax)}</dd>
        </div>
        <div className="flex justify-between border-t border-zinc-200 pt-2 text-lg font-bold text-[#b12704]">
          <dt>Order total:</dt>
          <dd className="tabular-nums">{formatPrice(t.total)}</dd>
        </div>
      </dl>
      {t.taxRate === null && <p className="mt-2 text-xs text-zinc-600">Tax is calculated once you choose a shipping state.</p>}
    </div>
  );
}
