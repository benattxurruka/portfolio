"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { syncPhotoCache } from "@/actions/syncPhotoCache";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSync() {
    startTransition(async () => {
      await syncPhotoCache();
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      title="Re-fetch photos from R2 (use after adding or deleting files in the bucket)"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                 bg-surface-2 border border-border text-ink-secondary
                 hover:border-accent hover:text-accent
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Syncing…" : "Sync R2"}
    </button>
  );
}
