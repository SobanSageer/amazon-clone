"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { signInAction, signUpAction, type AuthFormState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
}) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div>
      <label htmlFor={name} className="block text-[13px] font-bold text-m-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "mt-1 h-9 w-full rounded-md border bg-m-surface px-2 text-base text-m-ink shadow-sm focus:border-m-accent focus:ring-2 focus:ring-m-accent/30 focus:outline-none sm:text-[13px]",
          error ? "border-m-deal" : "border-m-border-strong",
        )}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-m-deal">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1 text-xs text-m-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-8 w-full items-center justify-center gap-2 rounded-full bg-m-accent text-[13px] font-medium text-white shadow-sm hover:bg-m-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m-accent disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

function FormError({ state }: { state: AuthFormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="rounded-lg border border-m-deal/30 bg-m-error-bg p-3 text-[13px] text-m-ink">
      <span className="block font-bold text-m-deal">There was a problem</span>
      {state.error}
    </p>
  );
}

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action] = useActionState(signInAction, {});
  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormError state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" error={state.fieldErrors?.password} />
      <Submit>Sign in</Submit>
    </form>
  );
}

export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action] = useActionState(signUpAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormError state={state} />
      <Field label="Your name" name="name" autoComplete="name" defaultValue={state.values?.name} error={state.fieldErrors?.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        hint="At least 8 characters."
      />
      <Field label="Re-enter password" name="confirm" type="password" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <Submit>Continue</Submit>
    </form>
  );
}
