"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { unlockGallery } from "@/actions/galleryConfig";
import type { GalleryActionState } from "@/actions/galleryConfig";

interface Props {
  galleryId: string;
  gallerySlug: string;
  galleryName: string;
}

export function PrivateGalleryGate({ galleryId, gallerySlug, galleryName }: Props) {
  const [state, formAction, isPending] = useActionState<GalleryActionState, FormData>(
    unlockGallery,
    {}
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="p-4 rounded-2xl bg-surface-2 border border-border mb-6">
        <Lock className="w-8 h-8 text-ink-muted" />
      </div>

      <h1 className="text-xl font-semibold text-ink-primary mb-1">{galleryName}</h1>
      <p className="text-ink-secondary text-sm mb-8 text-center max-w-xs">
        This gallery is private. Enter the password to view the photos.
      </p>

      <form action={formAction} className="w-full max-w-xs space-y-3">
        <input type="hidden" name="galleryId" value={galleryId} />
        <input type="hidden" name="gallerySlug" value={gallerySlug} />

        {state.error && (
          <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg text-center">
            {state.error}
          </p>
        )}

        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border
                     text-ink-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent
                     placeholder:text-ink-muted"
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5
                     rounded-lg bg-accent text-white text-sm font-medium
                     hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          {isPending ? "Checking…" : "Unlock gallery"}
        </button>
      </form>
    </div>
  );
}
