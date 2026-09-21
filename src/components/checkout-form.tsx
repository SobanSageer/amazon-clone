"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { CreditCard, Loader2, Lock } from "lucide-react";
import { placeOrderAction, type CheckoutState } from "@/app/actions/checkout";
import { OrderSummary } from "@/components/order-summary";
import { formatPrice } from "@/lib/format";
import { arrivalFor, processingDays } from "@/lib/delivery";
import { cardBrand, formatCardNumber, formatExpiry, TEST_CARD } from "@/lib/payment";
import { findPromo, orderTotals, promoProblem, PROMOS, SHIPPING_SPEEDS, shippingFeeFor, type ShippingSpeed } from "@/lib/pricing";
import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";

type SavedAddress = {
  id: string;
  fullName: string;
  street: string;
  unit: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string;
};
type Line = { id: string; quantity: number; product: { title: string; thumbnail: string; price: number; slug: string; shipping?: string } };

const inputCls = (error?: string) =>
  cn(
    "mt-1 h-11 w-full rounded-md border bg-white px-3 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500 sm:text-sm",
    error ? "border-red-600" : "border-zinc-300",
  );

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="mt-1 text-sm text-red-700">
      {error}
    </p>
  ) : null;
}

function TextField(props: {
  name: string;
  label: string;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={props.className}>
      <label htmlFor={props.name} className="block text-sm font-semibold text-zinc-900">
        {props.label}
        {props.optional && <span className="font-normal text-zinc-500"> (optional)</span>}
      </label>
      <input
        id={props.name}
        name={props.name}
        defaultValue={props.defaultValue}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={props.error ? `${props.name}-error` : undefined}
        className={inputCls(props.error)}
      />
      <ErrorText id={`${props.name}-error`} error={props.error} />
    </div>
  );
}

function Section({ step, title, children, action }: { step: number; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${step}`} className="rounded-xl bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={`step-${step}`} className="flex items-center gap-3 text-lg font-bold text-zinc-900">
          <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-zinc-900 text-sm text-white">
            {step}
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PlaceOrderButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amz-yellow text-base font-semibold text-zinc-900 hover:bg-amz-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
      {pending ? "Placing your order…" : "Place your order"}
    </button>
  );
}

export function CheckoutForm({
  addresses,
  items,
  subtotal,
}: {
  addresses: SavedAddress[];
  items: Line[];
  subtotal: number;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrderAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed attempt, take keyboard and screen-reader users straight to the problem.
  useEffect(() => {
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
    first?.focus();
    first?.scrollIntoView({ block: "center" });
  }, [state]);

  // Submitted via a transition rather than <form action>, so React doesn't auto-reset the
  // form after an error (that silently cleared the State select and bounced the retry).
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "new");
  const [newState, setNewState] = useState(state.address?.state ?? "");
  const [speed, setSpeed] = useState<ShippingSpeed>("standard");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  // Live totals: the server recomputes the same numbers when the order is placed.
  const shipState = addressId === "new" ? newState || null : (addresses.find((a) => a.id === addressId)?.state ?? null);
  const totals = orderTotals(subtotal, { speed, state: shipState, promoCode: promo || null });
  const processing = Math.max(1, ...items.map((i) => processingDays(i.product.shipping)));

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const problem = promoProblem(code, subtotal);
    if (problem) {
      setPromoMsg(problem);
      return;
    }
    setPromo(code);
    setPromoMsg(null);
    setPromoInput("");
  }
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const ae = state.addressErrors ?? {};
  const ce = state.cardErrors ?? {};
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex flex-col gap-4">
        {state.error && (
          <p role="alert" tabIndex={-1} className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {state.error}{" "}
            <Link href="/cart" className="font-semibold underline">
              Go to cart
            </Link>
          </p>
        )}

        <Section step={1} title="Shipping address">
          <fieldset>
            <legend className="sr-only">Choose a shipping address</legend>
            <div className="flex flex-col gap-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-amber-500",
                    addressId === a.id ? "border-amber-500 bg-amber-50" : "border-zinc-200 hover:border-zinc-300",
                  )}
                >
                  <input
                    type="radio"
                    name="addressId"
                    value={a.id}
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                    className="mt-1 accent-amber-600"
                  />
                  <span>
                    <span className="font-semibold text-zinc-900">{a.fullName}</span>
                    <span className="block text-zinc-700">
                      {a.street}
                      {a.unit ? `, ${a.unit}` : ""}, {a.city}, {a.state} {a.zip}
                    </span>
                    <span className="block text-zinc-600">{a.phone}</span>
                  </span>
                </label>
              ))}
              {addresses.length > 0 && (
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-amber-500",
                    addressId === "new" ? "border-amber-500 bg-amber-50" : "border-zinc-200 hover:border-zinc-300",
                  )}
                >
                  <input
                    type="radio"
                    name="addressId"
                    value="new"
                    checked={addressId === "new"}
                    onChange={() => setAddressId("new")}
                    className="accent-amber-600"
                  />
                  Ship to a new address
                </label>
              )}
              {addresses.length === 0 && <input type="hidden" name="addressId" value="new" />}
            </div>
            <ErrorText id="addressId-error" error={ae.addressId} />
          </fieldset>

          {addressId === "new" && (
            <div className="mt-4 grid grid-cols-6 gap-4">
              <TextField className="col-span-6 sm:col-span-3" name="fullName" label="Full name" autoComplete="shipping name" defaultValue={state.address?.fullName} error={ae.fullName} />
              <TextField className="col-span-6 sm:col-span-3" name="phone" label="Phone number" autoComplete="shipping tel" inputMode="tel" defaultValue={state.address?.phone} error={ae.phone} />
              <TextField className="col-span-6" name="street" label="Street address" autoComplete="shipping address-line1" defaultValue={state.address?.street} error={ae.street} />
              <TextField className="col-span-6" name="unit" label="Apt, suite, unit" optional autoComplete="shipping address-line2" defaultValue={state.address?.unit} error={ae.unit} />
              <TextField className="col-span-6 sm:col-span-3" name="city" label="City" autoComplete="shipping address-level2" defaultValue={state.address?.city} error={ae.city} />
              <div className="col-span-3 sm:col-span-2">
                <label htmlFor="state" className="block text-sm font-semibold text-zinc-900">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  autoComplete="shipping address-level1"
                  defaultValue={state.address?.state ?? ""}
                  onChange={(e) => setNewState(e.target.value)}
                  aria-invalid={ae.state ? true : undefined}
                  aria-describedby={ae.state ? "state-error" : undefined}
                  className={inputCls(ae.state)}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {US_STATES.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                <ErrorText id="state-error" error={ae.state} />
              </div>
              <TextField className="col-span-3 sm:col-span-1" name="zip" label="ZIP" autoComplete="shipping postal-code" inputMode="numeric" defaultValue={state.address?.zip} error={ae.zip} />
            </div>
          )}
        </Section>

        <Section step={2} title="Delivery speed">
          <fieldset>
            <legend className="sr-only">Choose a delivery speed</legend>
            <div className="flex flex-col gap-2">
              {(Object.keys(SHIPPING_SPEEDS) as ShippingSpeed[]).map((sp) => {
                const fee = promo && findPromo(promo)?.kind === "free-shipping" && sp === "standard" ? 0 : shippingFeeFor(sp, subtotal);
                return (
                  <label
                    key={sp}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#007185]",
                      speed === sp ? "border-[#007185] bg-[#f0f8fa]" : "border-zinc-200 hover:border-zinc-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="shippingSpeed"
                      value={sp}
                      checked={speed === sp}
                      onChange={() => setSpeed(sp)}
                      className="mt-1 accent-[#007185]"
                    />
                    <span className="flex-1">
                      <span className="block font-bold text-[#067d62]">{arrivalFor(processing, sp).long}</span>
                      <span className="block text-zinc-700">
                        {fee === 0 ? "FREE" : formatPrice(fee)} — {SHIPPING_SPEEDS[sp].label}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {processing > 3 && (
            <p className="mt-2 text-xs text-zinc-600">Delivery dates include time for items that take longer to ship.</p>
          )}
        </Section>

        <Section
          step={3}
          title="Payment"
          action={
            <button
              type="button"
              onClick={() => setCard(TEST_CARD)}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              Use test card
            </button>
          }
        >
          <p className="mb-4 flex items-start gap-2 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700">
            <CreditCard className="mt-0.5 size-4 shrink-0" aria-hidden />
            Payment is simulated. Nothing is charged and card numbers are never stored — please don’t enter a real card.
          </p>
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-6">
              <label htmlFor="cardName" className="block text-sm font-semibold text-zinc-900">
                Name on card
              </label>
              <input
                id="cardName"
                name="cardName"
                autoComplete="off"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                aria-invalid={ce.name ? true : undefined}
                aria-describedby={ce.name ? "cardName-error" : undefined}
                className={inputCls(ce.name)}
              />
              <ErrorText id="cardName-error" error={ce.name} />
            </div>
            <div className="col-span-6">
              <label htmlFor="cardNumber" className="flex justify-between text-sm font-semibold text-zinc-900">
                Card number
                {card.number && <span className="font-normal text-zinc-500">{cardBrand(card.number)}</span>}
              </label>
              <input
                id="cardNumber"
                name="cardNumber"
                inputMode="numeric"
                autoComplete="off"
                placeholder="1234 1234 1234 1234"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                aria-invalid={ce.number ? true : undefined}
                aria-describedby={ce.number ? "cardNumber-error" : undefined}
                className={cn(inputCls(ce.number), "tabular-nums")}
              />
              <ErrorText id="cardNumber-error" error={ce.number} />
            </div>
            <div className="col-span-3">
              <label htmlFor="cardExpiry" className="block text-sm font-semibold text-zinc-900">
                Expiry
              </label>
              <input
                id="cardExpiry"
                name="cardExpiry"
                inputMode="numeric"
                autoComplete="off"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                aria-invalid={ce.expiry ? true : undefined}
                aria-describedby={ce.expiry ? "cardExpiry-error" : undefined}
                className={cn(inputCls(ce.expiry), "tabular-nums")}
              />
              <ErrorText id="cardExpiry-error" error={ce.expiry} />
            </div>
            <div className="col-span-3">
              <label htmlFor="cardCvc" className="block text-sm font-semibold text-zinc-900">
                Security code
              </label>
              <input
                id="cardCvc"
                name="cardCvc"
                inputMode="numeric"
                autoComplete="off"
                placeholder="CVC"
                maxLength={4}
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })}
                aria-invalid={ce.cvc ? true : undefined}
                aria-describedby={ce.cvc ? "cardCvc-error" : undefined}
                className={cn(inputCls(ce.cvc), "tabular-nums")}
              />
              <ErrorText id="cardCvc-error" error={ce.cvc} />
            </div>
          </div>
        </Section>

        <Section
          step={4}
          title={`Review items (${itemCount})`}
          action={
            <Link href="/cart" className="text-sm font-medium text-amz-link hover:underline">
              Edit cart
            </Link>
          }
        >
          <ul className="divide-y divide-zinc-200">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white">
                  <Image src={i.product.thumbnail} alt="" fill sizes="56px" className="object-contain p-1" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-medium text-zinc-900">{i.product.title}</span>
                  <span className="text-xs text-zinc-600">Qty {i.quantity}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatPrice(i.product.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="lg:sticky lg:top-4">
        <input type="hidden" name="promoCode" value={promo} />
        <OrderSummary totals={totals} itemCount={itemCount} speed={speed} state={shipState}>
          <PlaceOrderButton pending={pending} />
          <p className="mt-2 text-center text-xs text-zinc-600">Simulated payment — you won’t be charged.</p>
        </OrderSummary>
        <div className="mt-3 rounded-lg border border-[#d5d9d9] bg-white p-4">
          {promo ? (
            <p className="flex items-center justify-between gap-2 text-sm">
              <span>
                <span className="font-bold text-[#067d62]">{promo}</span> applied — {findPromo(promo)?.description}
              </span>
              <button
                type="button"
                onClick={() => setPromo("")}
                className="text-[13px] text-amz-link hover:text-amz-link-hover hover:underline"
              >
                Remove
              </button>
            </p>
          ) : (
            <>
              <label htmlFor="promo-input" className="block text-sm font-bold text-[#0f1111]">
                Gift card or promo code
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="promo-input"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyPromo();
                    }
                  }}
                  aria-invalid={promoMsg || state.promoError ? true : undefined}
                  aria-describedby="promo-help"
                  className="h-8 min-w-0 flex-1 rounded-[3px] border border-[#a6a6a6] px-2 text-base uppercase focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,.5)] focus:outline-none sm:text-sm"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="h-8 rounded-lg border border-[#d5d9d9] bg-white px-3 text-[13px] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa]"
                >
                  Apply
                </button>
              </div>
              <p id="promo-help" className={cn("mt-1 text-xs", promoMsg || state.promoError ? "text-[#c40000]" : "text-zinc-600")} aria-live="polite">
                {promoMsg ?? state.promoError ?? `Demo codes: ${PROMOS.map((p) => p.code).join(", ")}`}
              </p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
