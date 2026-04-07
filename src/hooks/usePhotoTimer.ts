"use client";

import { useEffect, useRef } from "react";
import { recordViewDuration } from "@/actions/view";

/**
 * Tracks how long a photo was viewed and flushes the duration
 * metric when the photo changes or the lightbox closes.
 */
export function usePhotoTimer(photoId: string | null) {
  const startRef = useRef<number | null>(null);
  const lastPhotoIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Flush the previous photo's timer if the photo changed
    if (
      lastPhotoIdRef.current &&
      lastPhotoIdRef.current !== photoId &&
      startRef.current !== null
    ) {
      const durationSeconds = (Date.now() - startRef.current) / 1000;
      const id = lastPhotoIdRef.current;
      // Fire-and-forget
      recordViewDuration(id, durationSeconds).catch(() => {});
    }

    if (photoId) {
      startRef.current = Date.now();
      lastPhotoIdRef.current = photoId;
    } else {
      startRef.current = null;
      lastPhotoIdRef.current = null;
    }
  }, [photoId]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (lastPhotoIdRef.current && startRef.current !== null) {
        const durationSeconds = (Date.now() - startRef.current) / 1000;
        const id = lastPhotoIdRef.current;
        recordViewDuration(id, durationSeconds).catch(() => {});
      }
    };
  }, []);
}
