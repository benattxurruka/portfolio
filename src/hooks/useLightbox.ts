"use client";

import { useState, useCallback, useEffect } from "react";
import type { Photo } from "@/lib/r2/types";

/** Milliseconds between auto-advances in slideshow mode. */
export const SLIDESHOW_DELAY = 5000;

export function useLightbox(photos: Photo[]) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const isOpen = currentIndex !== null;
  const currentPhoto = currentIndex !== null ? photos[currentIndex] : null;

  const open = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const close = useCallback(() => {
    setCurrentIndex(null);
    setIsPlaying(false);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i === null ? 0 : (i + 1) % photos.length));
  }, [photos.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) =>
      i === null ? 0 : (i - 1 + photos.length) % photos.length
    );
  }, [photos.length]);

  const togglePlay = useCallback(() => setIsPlaying((v) => !v), []);

  // Auto-advance while playing
  useEffect(() => {
    if (!isPlaying || !isOpen) return;
    const id = setInterval(next, SLIDESHOW_DELAY);
    return () => clearInterval(id);
  }, [isPlaying, isOpen, next]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") close();
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, next, prev, close, togglePlay]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return {
    isOpen, currentIndex, currentPhoto,
    open, close, next, prev,
    isPlaying, togglePlay,
  };
}
