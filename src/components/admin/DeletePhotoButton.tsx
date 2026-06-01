"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  r2Key: string;
}

export function DeletePhotoButton({ r2Key }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/admin/api/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ r2Key }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Delete failed");
        setDeleting(false);
        return;
      }
      router.push("/admin/photos");
    } catch (err) {
      setError(String(err));
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                   text-red-400 border border-red-400/30 bg-red-500/5
                   hover:bg-red-500/10 hover:border-red-400/60 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Eliminar foto
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-secondary">
        ¿Eliminar permanentemente esta foto de R2? Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg text-sm font-medium
                     bg-red-500 text-white hover:bg-red-600
                     disabled:opacity-50 transition-colors"
        >
          {deleting ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg text-sm border border-border
                     text-ink-muted hover:text-ink-primary transition-colors"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
