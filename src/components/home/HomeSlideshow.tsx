"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface Slide {
  url: string;
  title: string;
}

interface Props {
  slides: Slide[];
  labelText: string;
  linkText: string;
}

export function HomeSlideshow({ slides, labelText, linkText }: Props) {
  const [current, setCurrent] = useState(0);

  const advance = useCallback(() => {
    if (slides.length > 1) {
      setCurrent((i) => (i + 1) % slides.length);
    }
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(advance, 3500);
    return () => clearInterval(id);
  }, [advance, slides.length]);

  return (
    <>
      {/* Slides */}
      {slides.length === 0 ? (
        <div className="absolute inset-0 bg-[#1a1a1a]" />
      ) : (
        slides.map((slide, i) => (
          <div
            key={slide.url}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            <Image
              src={slide.url}
              alt={slide.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, calc(100vw - 240px)"
              priority={i === 0}
            />
          </div>
        ))
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* Section label — top left */}
      <span
        className="absolute top-[22px] left-7 text-white text-[15px] pointer-events-none select-none"
        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
      >
        {labelText}
      </span>

      {/* "Ver galería →" pill — bottom left */}
      <Link
        href="/photography"
        className="absolute bottom-5 left-7 text-white text-[13px] no-underline rounded-[20px]
                   px-3 py-1.5 hover:bg-black/50 transition-colors"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        {linkText}
      </Link>

      {/* Slide dots — bottom right */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 right-7 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className="w-[7px] h-[7px] rounded-full transition-colors border-0 p-0 cursor-pointer"
              style={{ background: i === current ? "#fff" : "rgba(255,255,255,0.35)" }}
            />
          ))}
        </div>
      )}
    </>
  );
}
