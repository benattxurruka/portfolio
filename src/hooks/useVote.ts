"use client";

import { useState, useEffect, useTransition } from "react";
import { voteForPhoto, unvoteForPhoto } from "@/actions/vote";

const STORAGE_PREFIX = "portfolio:voted:";

export function useVote(
  photoId: string,
  gallerySlug: string,
  initialCount: number
) {
  const [hasVoted, setHasVoted] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  // Hydrate voted state from localStorage after mount
  useEffect(() => {
    try {
      setHasVoted(
        localStorage.getItem(`${STORAGE_PREFIX}${photoId}`) === "true"
      );
    } catch {
      // localStorage unavailable (e.g. SSR or private mode restrictions)
    }
  }, [photoId]);

  function toggle() {
    if (isPending) return;

    if (hasVoted) {
      // Optimistic unvote
      setHasVoted(false);
      setCount((c) => Math.max(0, c - 1));
      try { localStorage.removeItem(`${STORAGE_PREFIX}${photoId}`); } catch {}

      startTransition(async () => {
        const result = await unvoteForPhoto(photoId, gallerySlug);
        if (!result.success) {
          setHasVoted(true);
          setCount((c) => c + 1);
          try { localStorage.setItem(`${STORAGE_PREFIX}${photoId}`, "true"); } catch {}
        } else if (result.newCount !== undefined) {
          setCount(result.newCount);
        }
      });
    } else {
      // Optimistic vote
      setHasVoted(true);
      setCount((c) => c + 1);
      try { localStorage.setItem(`${STORAGE_PREFIX}${photoId}`, "true"); } catch {}

      startTransition(async () => {
        const result = await voteForPhoto(photoId, gallerySlug);
        if (!result.success) {
          setHasVoted(false);
          setCount((c) => Math.max(0, c - 1));
          try { localStorage.removeItem(`${STORAGE_PREFIX}${photoId}`); } catch {}
        } else if (result.newCount !== undefined) {
          setCount(result.newCount);
        }
      });
    }
  }

  return { hasVoted, count, vote: toggle, isPending };
}
