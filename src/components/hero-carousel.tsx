"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  images: string[];
  bg: string;
};

const INTERVAL_MS = 6000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const rotating = !paused && !held && !reduceMotion && slides.length > 1;
  useEffect(() => {
    if (!rotating) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [rotating, slides.length]);

  const go = (d: number) => setIndex((i) => (i + d + slides.length) % slides.length);
  const slide = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      className={cn("relative overflow-hidden transition-colors duration-500", slide.bg)}
    >
      <div
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${slides.length}: ${slide.title}`}
        aria-live={rotating ? "off" : "polite"}
        className="mx-auto grid max-w-7xl items-center gap-6 px-12 pb-20 pt-8 sm:px-16 sm:pb-24 md:grid-cols-[1.1fr_1fr] lg:pb-64"
      >
        <div key={index} className="animate-in fade-in duration-500">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-800">{slide.eyebrow}</p>
          <h2 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 text-balance sm:text-5xl">
            {slide.title}
          </h2>
          <p className="mt-3 max-w-lg text-base text-zinc-800 sm:text-lg">{slide.body}</p>
          <Link
            href={slide.href}
            className="mt-5 inline-block rounded-full bg-amz-yellow px-5 py-2.5 text-sm font-bold text-zinc-900 shadow-sm hover:bg-amz-yellow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            {slide.cta}
          </Link>
        </div>
        <div aria-hidden key={`img-${index}`} className="hidden grid-cols-3 gap-3 animate-in fade-in duration-500 md:grid">
          {slide.images.slice(0, 3).map((src, i) => (
            <div
              key={src}
              className={cn("relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/90 shadow-sm", i === 1 ? "-translate-y-4" : "translate-y-2")}
            >
              <Image src={src} alt="" fill sizes="180px" className="object-contain p-3" priority={index === 0} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous slide"
        className="absolute left-0 top-0 flex h-full max-h-[70%] w-10 items-center justify-center text-zinc-800 hover:bg-black/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#007185] sm:w-14"
      >
        <ChevronLeft className="size-9" strokeWidth={1.5} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next slide"
        className="absolute right-0 top-0 flex h-full max-h-[70%] w-10 items-center justify-center text-zinc-800 hover:bg-black/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#007185] sm:w-14"
      >
        <ChevronRight className="size-9" strokeWidth={1.5} aria-hidden />
      </button>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 sm:bottom-8 lg:bottom-56">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}: ${s.title}`}
            aria-current={i === index ? "true" : undefined}
            className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-zinc-900" : "w-2 bg-zinc-900/30 hover:bg-zinc-900/50")}
          />
        ))}
        {slides.length > 1 && !reduceMotion && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play carousel" : "Pause carousel"}
            className="ml-1 rounded-full bg-white/80 p-1 text-zinc-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-[#007185]"
          >
            {paused ? <Play className="size-3" aria-hidden /> : <Pause className="size-3" aria-hidden />}
          </button>
        )}
      </div>
    </section>
  );
}
