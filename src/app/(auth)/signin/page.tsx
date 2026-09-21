import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { SignInForm, SignUpForm } from "@/components/auth-forms";

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

  const href = (m: string) => `/signin?${new URLSearchParams({ mode: m, callbackUrl })}`;
  const fromCheckout = callbackUrl.startsWith("/checkout");

  return (
    <div className="px-4 pb-10 pt-2">
      <div className="mx-auto w-full max-w-[350px]">
        <section className="rounded-lg border border-[#ddd] px-6 py-5">
          <h1 className="text-[28px] font-normal leading-tight text-[#0f1111]">
            {mode === "signup" ? "Create account" : "Sign in"}
          </h1>
          {fromCheckout && mode === "signin" && (
            <p className="mt-1 text-[13px] text-zinc-700">Sign in to check out. Your cart comes with you.</p>
          )}
          <div className="mt-4">
            {mode === "signup" ? <SignUpForm callbackUrl={callbackUrl} /> : <SignInForm callbackUrl={callbackUrl} />}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#0f1111]">
            This is a portfolio clone, not Amazon. Don’t reuse your real Amazon password here.
          </p>
          {mode === "signup" && (
            <p className="mt-4 border-t border-zinc-200 pt-4 text-[13px] text-[#0f1111]">
              Already have an account?{" "}
              <Link href={href("signin")} className="inline-flex items-center text-amz-link hover:text-amz-link-hover hover:underline">
                Sign in <ChevronRight className="size-3" aria-hidden />
              </Link>
            </p>
          )}
        </section>

        {mode === "signin" && (
          <>
            <div className="mt-6 flex items-center gap-2 text-xs text-zinc-600" aria-hidden>
              <span className="h-px flex-1 bg-zinc-200" />
              New to Amazon Clone?
              <span className="h-px flex-1 bg-zinc-200" />
            </div>
            <Link
              href={href("signup")}
              className="mt-3 flex h-8 items-center justify-center rounded-full border border-[#d5d9d9] bg-white text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007185]"
            >
              Create your Amazon Clone account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
