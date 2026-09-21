"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toggleListAction } from "@/app/actions/list";
import { useMe } from "@/components/header-actions";

const cls =
  "flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#d5d9d9] bg-white text-[13px] text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-[#f7fafa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007185] disabled:opacity-60";

export function ListButton({ productId }: { productId: string }) {
  const { me } = useMe();
  const pathname = usePathname();
  const signedIn = Boolean(me?.user);
  const [inList, setInList] = useState<boolean | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!signedIn) return;
    const ctrl = new AbortController();
    fetch(`/api/product-state?productId=${encodeURIComponent(productId)}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInList(d.inList))
      .catch(() => {});
    return () => ctrl.abort();
  }, [signedIn, productId]);

  if (!signedIn) {
    return (
      <Link href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`} className={cls}>
        Add to List
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending || inList === null}
        aria-pressed={inList ?? false}
        onClick={() =>
          start(async () => {
            const res = await toggleListAction(productId);
            if ("inList" in res) setInList(res.inList);
          })
        }
        className={cls}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : inList ? <Check className="size-3.5 text-[#067d62]" aria-hidden /> : null}
        {inList ? "Added to Your List" : "Add to List"}
      </button>
      {inList && (
        <Link href="/list" className="mt-1 block text-center text-xs text-amz-link hover:text-amz-link-hover hover:underline">
          View Your List
        </Link>
      )}
    </div>
  );
}
