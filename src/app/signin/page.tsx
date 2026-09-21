import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { demoSignInAction } from "@/app/actions/auth";
import { DemoButton, SignInForm, SignUpForm } from "@/components/auth-forms";
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

  return (
    <div className="bg-zinc-100 px-4 py-8 sm:py-12">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {fromCheckout ? "Sign in to check out" : mode === "signup" ? "Create your account" : "Sign in"}
          </h1>
          {fromCheckout && <p className="mt-1 text-sm text-zinc-600">Your cart is saved and comes with you.</p>}
        </div>

        <section aria-labelledby="demo-heading" className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
          <h2 id="demo-heading" className="font-semibold text-zinc-900">
            Just looking around?
          </h2>
          <p className="mt-1 text-sm text-zinc-700">
            Use the shared demo account to try checkout and order history without signing up.
          </p>
          <form action={demoSignInAction} className="mt-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <DemoButton />
          </form>
        </section>

        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-zinc-500" aria-hidden>
          <span className="h-px flex-1 bg-zinc-300" />
          or use your own account
          <span className="h-px flex-1 bg-zinc-300" />
        </div>

        <section className="rounded-xl bg-white p-5 sm:p-6">
          <nav aria-label="Account options" className="mb-5 grid grid-cols-2 rounded-full bg-zinc-100 p-1 text-sm font-semibold">
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
        </section>
      </div>
    </div>
  );
}
