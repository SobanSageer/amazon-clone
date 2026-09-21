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
      <label htmlFor={name} className="block text-[13px] font-bold text-[#0f1111]">
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
          "mt-1 h-9 w-full rounded-[3px] border bg-white px-2 text-base text-[#0f1111] shadow-[0_1px_0_rgba(255,255,255,.5),0_1px_0_rgba(0,0,0,.07)_inset] focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,.5)] focus:outline-none sm:text-[13px]",
          error ? "border-[#d00]" : "border-[#a6a6a6] border-t-[#949494]",
        )}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-[#c40000]">
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
      className="flex h-8 w-full items-center justify-center gap-2 rounded-full bg-amz-yellow text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007185] disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

function FormError({ state }: { state: AuthFormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="rounded-lg border border-[#c40000] p-3 text-[13px] text-[#0f1111] shadow-[0_0_0_4px_#fcf4f4_inset]">
      <span className="block font-bold text-[#c40000]">There was a problem</span>
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
