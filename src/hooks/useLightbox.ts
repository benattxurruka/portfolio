"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  // On the very first run, try to hydrate currentIndex from the URL first —
  // otherwise this effect would delete ?photo=<id> before the mount-time
  // read below ever got a chance to see it (currentIndex starts as null).
  const hydratedFromUrl = useRef(false);
  useEffect(() => {
    if (!hydratedFromUrl.current) {
      hydratedFromUrl.current = true;
      const id = new URLSearchParams(window.location.search).get("photo");
      const index = id ? photos.findIndex((p) => p.id === id) : -1;
      if (index !== -1) {
        setCurrentIndex(index);
        return;
      }
    }

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
