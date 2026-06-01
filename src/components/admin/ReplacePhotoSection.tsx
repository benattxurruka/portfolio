"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

interface Props {
  r2Key: string;
}

export function ReplacePhotoSection({ r2Key }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStatus("idle");
    setErrorMsg("");
  }

  async function handleReplace() {
    if (!pendingFile || !preview) return;
    setStatus("uploading");
    setErrorMsg("");

    // Measure actual pixel dimensions client-side
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = preview;
    });

    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      fd.append("r2Key", r2Key);
      if (width > 0) fd.append("width", String(width));
      if (height > 0) fd.append("height", String(height));

      const res = await fetch("/admin/api/replace", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Upload failed");
        return;
      }

      setStatus("done");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMsg(String(err));
    }
  }

  function handleCancel() {
    setPendingFile(null);
    setPreview(null);
    setStatus("idle");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const inputClass =
    "px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-ink-secondary text-sm " +
    "hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="space-y-3">
      <p className="block text-sm text-ink-secondary">Replace image file</p>
      <p className="text-xs text-ink-muted">
        Overwrites the file at <code className="font-mono">{r2Key}</code> with a
        new image while keeping all existing metadata.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!pendingFile ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={inputClass}
        >
          <span className="inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Choose replacement file…
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-border"
            />
          )}
          <p className="text-xs text-ink-muted">{pendingFile.name}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReplace}
              disabled={status === "uploading"}
              className={inputClass}
            >
              {status === "uploading" ? "Replacing…" : "Confirm replace"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={status === "uploading"}
              className={inputClass}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === "done" && (
        <p className="text-sm text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
          Image replaced successfully.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
