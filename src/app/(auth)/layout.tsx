import Link from "next/link";
import { MinimalFooter } from "@/components/minimal-footer";
import { Wordmark } from "@/components/wordmark";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex justify-center pb-2 pt-4">
        <Link
          href="/"
          aria-label={`${site.name} home`}
          className="rounded-sm px-2 py-1 focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <Wordmark tone="dark" />
        </Link>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <MinimalFooter />
    </>
  );
}
