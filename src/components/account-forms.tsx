"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  changePasswordAction,
  saveAddressAction,
  updateNameAction,
  type AddressState,
  type SimpleState,
} from "@/app/actions/account";
import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";

const input = (error?: string) =>
  cn(
    "mt-1 h-9 w-full rounded-md border bg-m-surface px-2 text-base text-m-ink focus:border-m-accent focus:ring-2 focus:ring-m-accent/30 focus:outline-none sm:text-[13px]",
    error ? "border-m-deal" : "border-m-border-strong",
  );

function Field({
  name,
  label,
  error,
  type = "text",
  defaultValue,
  autoComplete,
  optional,
  className,
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
  optional?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-[13px] font-bold text-m-ink">
        {label}
        {optional && <span className="font-normal text-m-dim"> (optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={input(error)}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-m-deal">
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-8 items-center gap-2 rounded-full bg-m-accent px-5 text-[13px] font-medium text-white shadow-sm hover:bg-m-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-accent disabled:opacity-60"
    >
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

function useSubmit<S>(action: (payload: FormData) => void, state: S) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
  return { ref, onSubmit };
}

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(updateNameAction, {});
  const { ref, onSubmit } = useSubmit(action, state);
  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field name="name" label="Name" defaultValue={name} autoComplete="name" error={state.fieldErrors?.name} className="flex-1" />
      <SubmitButton pending={pending}>Save</SubmitButton>
      {state.ok && (
        <p role="status" className="flex items-center gap-1 text-sm text-m-success">
          <CheckCircle2 className="size-4" aria-hidden /> Saved
        </p>
      )}
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<SimpleState, FormData>(changePasswordAction, {});
  const { ref, onSubmit } = useSubmit(action, state);
  const fe = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state, ref]);
  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="grid max-w-md gap-3">
      <Field name="current" label="Current password" type="password" autoComplete="current-password" error={fe.current} />
      <Field name="next" label="New password" type="password" autoComplete="new-password" error={fe.next} />
      <Field name="confirmNext" label="Re-enter new password" type="password" autoComplete="new-password" error={fe.confirmNext} />
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending}>Change password</SubmitButton>
        {state.ok && (
          <p role="status" className="flex items-center gap-1 text-sm text-m-success">
            <CheckCircle2 className="size-4" aria-hidden /> Password changed
          </p>
        )}
      </div>
    </form>
  );
}

type AddressValues = { id?: string; fullName?: string; phone?: string; street?: string; unit?: string | null; city?: string; state?: string; zip?: string; isDefault?: boolean };

export function AddressForm({ initial }: { initial?: AddressValues }) {
  const [state, action, pending] = useActionState<AddressState, FormData>(saveAddressAction, {});
  const { ref, onSubmit } = useSubmit(action, state);
  const e = state.errors ?? {};
  const v = { ...initial, ...state.values };
  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="grid grid-cols-6 gap-3 rounded-lg border border-m-border p-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <Field className="col-span-6 sm:col-span-3" name="fullName" label="Full name" autoComplete="shipping name" defaultValue={v.fullName} error={e.fullName} />
      <Field className="col-span-6 sm:col-span-3" name="phone" label="Phone number" autoComplete="shipping tel" defaultValue={v.phone} error={e.phone} />
      <Field className="col-span-6" name="street" label="Street address" autoComplete="shipping address-line1" defaultValue={v.street} error={e.street} />
      <Field className="col-span-6" name="unit" label="Apt, suite, unit" optional autoComplete="shipping address-line2" defaultValue={v.unit ?? ""} error={e.unit} />
      <Field className="col-span-6 sm:col-span-3" name="city" label="City" autoComplete="shipping address-level2" defaultValue={v.city} error={e.city} />
      <div className="col-span-3 sm:col-span-2">
        <label htmlFor="state" className="block text-[13px] font-bold text-m-ink">
          State
        </label>
        <select
          id="state"
          name="state"
          defaultValue={v.state ?? ""}
          autoComplete="shipping address-level1"
          aria-invalid={e.state ? true : undefined}
          aria-describedby={e.state ? "state-error" : undefined}
          className={input(e.state)}
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
        {e.state && (
          <p id="state-error" className="mt-1 text-xs text-m-deal">
            {e.state}
          </p>
        )}
      </div>
      <Field className="col-span-3 sm:col-span-1" name="zip" label="ZIP" autoComplete="shipping postal-code" defaultValue={v.zip} error={e.zip} />
      <label className="col-span-6 flex items-center gap-2 text-sm text-m-ink">
        <input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} className="size-4 accent-m-accent" />
        Make this my default address
      </label>
      <div className="col-span-6 flex items-center gap-3">
        <SubmitButton pending={pending}>{initial?.id ? "Save changes" : "Add address"}</SubmitButton>
        <Link href="/account#addresses" className="text-[13px] text-m-accent-text hover:text-m-accent-hover hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
