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
      <label htmlFor={name} className="block text-sm font-semibold text-zinc-900">
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
          "mt-1 h-11 w-full rounded-md border bg-white px-3 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500 sm:text-sm",
          error ? "border-red-600" : "border-zinc-300",
        )}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1 text-xs text-zinc-600">
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
      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-amz-yellow text-sm font-semibold text-zinc-900 hover:bg-amz-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

function FormError({ state }: { state: AuthFormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
      {state.error}
    </p>
  );
}

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action] = useActionState(signInAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
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
      <Submit>Create account</Submit>
    </form>
  );
}
