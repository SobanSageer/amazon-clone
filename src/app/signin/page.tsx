import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm, SignUpForm } from "@/components/auth-forms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

function safeCallback(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export default async function SignInPage(props: PageProps<"/signin">) {
  const sp = await props.searchParams;
  const callbackUrl = safeCallback(sp.callbackUrl);
  const mode = sp.mode === "signup" ? "signup" : "signin";
  if ((await auth())?.user) redirect(callbackUrl);

  const fromCheckout = callbackUrl.startsWith("/checkout");
  const tabHref = (m: string) => `/signin?${new URLSearchParams({ mode: m, callbackUrl })}`;
  const heading = mode === "signup" ? "Create account" : fromCheckout ? "Sign in to check out" : "Sign in";

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-sm">
        <section className="rounded-lg border border-zinc-300 bg-white p-5 sm:p-6">
          <h1 className="text-2xl font-normal text-zinc-900 sm:text-[1.75rem]">{heading}</h1>
          {fromCheckout && mode === "signin" && (
            <p className="mt-1 text-sm text-zinc-600">Your cart is saved and comes with you.</p>
          )}
          <nav aria-label="Account options" className="my-5 grid grid-cols-2 rounded-full bg-zinc-100 p-1 text-sm font-semibold">
            {(["signin", "signup"] as const).map((m) => (
              <Link
                key={m}
                href={tabHref(m)}
                replace
                aria-current={mode === m ? "page" : undefined}
                className={cn(
                  "rounded-full py-2 text-center focus-visible:outline-2 focus-visible:outline-amber-500",
                  mode === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </Link>
            ))}
          </nav>
          {mode === "signup" ? <SignUpForm callbackUrl={callbackUrl} /> : <SignInForm callbackUrl={callbackUrl} />}
          <p className="mt-5 text-xs leading-relaxed text-zinc-600">
            This is a portfolio clone, not Amazon. Use a new password here — don’t reuse your real Amazon password.
          </p>
        </section>
        {mode === "signin" ? (
          <p className="mt-5 text-center text-sm text-zinc-700">
            New here?{" "}
            <Link href={tabHref("signup")} className="font-medium text-amz-link hover:underline">
              Create your account
            </Link>
          </p>
        ) : (
          <p className="mt-5 text-center text-sm text-zinc-700">
            Already have an account?{" "}
            <Link href={tabHref("signin")} className="font-medium text-amz-link hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
