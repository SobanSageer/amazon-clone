"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        <Image
          src={current}
          alt={images.length > 1 ? `${title}, image ${index + 1} of ${images.length}` : title}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-contain p-4"
          priority
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Product images">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                onMouseEnter={() => setIndex(i)}
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
      )}
    </div>
  );
}
