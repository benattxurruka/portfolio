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

  // Keep ?photo=<id> in the URL in sync with the open photo.
  // replaceState avoids polluting browser history on every next/prev.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentIndex === null) {
      if (url.searchParams.has("photo")) {
        url.searchParams.delete("photo");
        history.replaceState(null, "", url.toString());
      }
      return;
    }
    const id = photos[currentIndex]?.id;
    if (id && url.searchParams.get("photo") !== id) {
      url.searchParams.set("photo", id);
      history.replaceState(null, "", url.toString());
    }
  }, [currentIndex, photos]);

  // On mount: if the URL contains ?photo=<id>, open that photo directly.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("photo");
    if (!id) return;
    const index = photos.findIndex((p) => p.id === id);
    if (index !== -1) setCurrentIndex(index);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => setIsPlaying((v) => !v), []);

  const openAndPlay = useCallback((index = 0) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  }, []);

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
    isPlaying, togglePlay, openAndPlay,
  };
}
