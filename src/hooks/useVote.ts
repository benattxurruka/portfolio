"use client";

import { useState, useEffect, useTransition } from "react";
import { voteForPhoto } from "@/actions/vote";

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

  function vote() {
    if (hasVoted || isPending) return;

    // Optimistic update
    setHasVoted(true);
    setCount((c) => c + 1);

    try {
      localStorage.setItem(`${STORAGE_PREFIX}${photoId}`, "true");
    } catch {
      // ignore
    }

    startTransition(async () => {
      const result = await voteForPhoto(photoId, gallerySlug);
      if (!result.success) {
        // Rollback on error
        setHasVoted(false);
        setCount((c) => c - 1);
        try {
          localStorage.removeItem(`${STORAGE_PREFIX}${photoId}`);
        } catch {
          // ignore
        }
      } else if (result.newCount !== undefined) {
        setCount(result.newCount);
      }
    });
  }

  return { hasVoted, count, vote, isPending };
}
