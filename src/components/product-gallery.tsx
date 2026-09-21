"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user dismissed the share sheet
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Link copied" : "Share this product"}
      className="absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-[#007185]"
    >
      {copied ? <Check className="size-4 text-[#067d62]" aria-hidden /> : <Share className="size-4" aria-hidden />}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </button>
  );
}

function Thumbs({
  images,
  index,
  onPick,
  hover = false,
  className,
}: {
  images: string[];
  index: number;
  onPick: (i: number) => void;
  hover?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("flex gap-2", className)} aria-label="Product images">
      {images.map((src, i) => (
        <li key={src} className="shrink-0">
          <button
            type="button"
            onClick={() => onPick(i)}
            onMouseEnter={hover ? () => onPick(i) : undefined}
            aria-label={`Show image ${i + 1} of ${images.length}`}
            aria-pressed={i === index}
            className={cn(
              "relative block size-12 overflow-hidden rounded-lg border bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007185]",
              i === index ? "border-[#007185] shadow-[0_0_3px_2px_rgba(0,113,133,.5)]" : "border-zinc-300 hover:border-[#007185]",
            )}
          >
            <Image src={src} alt="" fill sizes="64px" className="object-contain p-1" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = images[index] ?? images[0];
  const many = images.length > 1;
  const step = (d: number) => setIndex((i) => (i + d + images.length) % images.length);
  const alt = many ? `${title}, image ${index + 1} of ${images.length}` : title;

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div className="flex-1">
        <div className="relative aspect-square w-full bg-white">
          <ShareButton title={title} />
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            aria-label={`Open full view of ${title}`}
            className="relative block size-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-[#007185]"
          >
            <Image src={current} alt={alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-contain p-4" priority />
          </button>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="mx-auto mt-1 hidden text-sm text-amz-link hover:text-amz-link-hover hover:underline md:block"
        >
          Click to see full view
        </button>
      </div>
      {many && <Thumbs images={images} index={index} onPick={setIndex} hover className="overflow-x-auto md:flex-col md:overflow-visible" />}

      <dialog
        ref={dialogRef}
        aria-label={`${title} images`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto h-[min(90vh,900px)] w-[min(95vw,1200px)] max-w-none rounded-lg bg-white p-0 backdrop:bg-black/70"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <p className="truncate pr-4 text-sm font-bold text-[#0f1111]">{title}</p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close full view"
              className="rounded-sm p-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-[#007185]"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <Image src={current} alt={alt} fill sizes="95vw" className="object-contain p-6" />
            {many && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-[#007185]"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-[#007185]"
                >
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </>
            )}
          </div>
          {many && <Thumbs images={images} index={index} onPick={setIndex} className="justify-center border-t border-zinc-200 p-3" />}
        </div>
      </dialog>
    </div>
  );
}
