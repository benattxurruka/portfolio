"use client";

import { useState, useCallback, useEffect } from "react";
import type { Photo } from "@/lib/r2/types";

export function useLightbox(photos: Photo[]) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const isOpen = currentIndex !== null;
  const currentPhoto = currentIndex !== null ? photos[currentIndex] : null;

  const open = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const close = useCallback(() => {
    setCurrentIndex(null);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i === null ? 0 : (i + 1) % photos.length));
  }, [photos.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) =>
      i === null ? 0 : (i - 1 + photos.length) % photos.length
    );
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") close();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, next, prev, close]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return { isOpen, currentIndex, currentPhoto, open, close, next, prev };
}
