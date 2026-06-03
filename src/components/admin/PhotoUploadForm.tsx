"use client";

import { useRef, useState } from "react";
import { Upload, Sparkles, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  step,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  const base =
    "w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-ink-primary text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-muted";
  return (
    <div>
      <label className="block text-sm text-ink-secondary mb-1" htmlFor={name}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={base}
      />
      {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PhotoUploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Form fields
  const [folder, setFolder] = useState("");
  const [title, setTitle] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // Exif-derived dimensions (sent with upload)
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  // Tags from photo EXIF/IPTC metadata (available as soon as file is picked)
  const [exifTags, setExifTags] = useState<string[]>([]);
  // Additional tags from AI (merged in after upload)
  const [aiTags, setAiTags] = useState<string[]>([]);

  // UI state
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [suggestingTags, setSuggestingTags] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadStatus("idle");
    setErrorMsg("");
    setSuccessMsg("");

    // Auto-fill title from filename (strip extension)
    if (!title) {
      setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    }

    // Read EXIF/IPTC data (including keywords)
    try {
      const exifr = await import("exifr");
      const exif = await exifr.default.parse(f, {
        gps: true,
        iptc: true,
        exif: true,
        tiff: true,
        xmp: true,
      });
      if (exif) {
        if (exif.DateTimeOriginal instanceof Date) {
          const d = exif.DateTimeOriginal;
          setTakenAt(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          );
        }
        if (typeof exif.latitude === "number") setLat(String(exif.latitude));
        if (typeof exif.longitude === "number") setLng(String(exif.longitude));
        const w = exif.ExifImageWidth ?? exif.ImageWidth;
        const h = exif.ExifImageHeight ?? exif.ImageHeight;
        if (w) setWidth(String(w));
        if (h) setHeight(String(h));

        // Keywords from IPTC/XMP (Lightroom, Capture One, etc.)
        const raw = exif.Keywords ?? exif.Subject ?? exif.keywords ?? exif.subject;
        if (raw) {
          const kws = (Array.isArray(raw) ? raw : String(raw).split(","))
            .map((k: unknown) => String(k).trim().toLowerCase())
            .filter(Boolean);
          setExifTags(kws);
        }
      }
    } catch {
      // exifr unavailable or failed — proceed without EXIF
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploadStatus("uploading");
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (folder) fd.append("folder", folder);
      if (title) fd.append("title", title);
      if (takenAt) fd.append("takenAt", takenAt);
      if (location) fd.append("location", location);
      if (tags) fd.append("tags", tags);
      if (lat) fd.append("lat", lat);
      if (lng) fd.append("lng", lng);
      if (width) fd.append("width", width);
      if (height) fd.append("height", height);

      const res = await fetch("/admin/api/upload", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setUploadStatus("error");
        setErrorMsg(json.error ?? "Upload failed");
        return;
      }

      // Build the public URL of the newly uploaded photo for tag suggestions
      const publicBase =
        process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
        (typeof window !== "undefined"
          ? (document.querySelector("meta[name=r2-public-url]") as HTMLMetaElement | null)?.content
          : undefined) ??
        "";
      const uploadedName = (json.r2Key as string).split("/").pop() ?? json.r2Key;

      // Trigger AI suggestions in the background before resetting
      if (publicBase) {
        const encoded = (json.r2Key as string)
          .split("/")
          .map(encodeURIComponent)
          .join("/");
        fetchSuggestions(`${publicBase}/${encoded}`);
      }

      // Reset form and show success banner
      handleReset();
      setSuccessMsg(`"${uploadedName}" subida correctamente.`);
    } catch (err) {
      setUploadStatus("error");
      setErrorMsg(String(err));
    }
  }

  async function fetchSuggestions(imageUrl: string) {
    setSuggestingTags(true);
    setSuggestError("");

    try {
      const res = await fetch("/admin/api/suggest-tags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSuggestError(json.error ?? "Failed to get suggestions");
        return;
      }
      const incoming = (json.tags as string[]) ?? [];
      // Merge with exif tags, keeping only genuinely new ones
      setAiTags((prev) => {
        const existing = new Set([...prev.map((t) => t.toLowerCase())]);
        const novel = incoming.filter((t) => !existing.has(t.toLowerCase()));
        return [...prev, ...novel];
      });
    } catch (err) {
      setSuggestError(String(err));
    } finally {
      setSuggestingTags(false);
    }
  }

  function addSuggestion(tag: string) {
    setTags((prev) => {
      const existing = prev.split(",").map((t) => t.trim()).filter(Boolean);
      if (existing.map((t) => t.toLowerCase()).includes(tag.toLowerCase())) return prev;
      return existing.length > 0 ? `${prev.trimEnd().replace(/,\s*$/, "")}, ${tag}` : tag;
    });
  }

  function currentTagSet(): Set<string> {
    return new Set(tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean));
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setFolder("");
    setTitle("");
    setTakenAt("");
    setLocation("");
    setTags("");
    setLat("");
    setLng("");
    setWidth("");
    setHeight("");
    setUploadStatus("idle");
    setErrorMsg("");
    setSuggestError("");
    setExifTags([]);
    setAiTags([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  const inputClass =
    "px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-ink-secondary text-sm " +
    "hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="space-y-6">
      {successMsg && (
        <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          ✓ {successMsg}
        </p>
      )}
      {/* ── File picker ── */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-12 rounded-xl
                       border-2 border-dashed border-border hover:border-accent/60 transition-colors
                       text-ink-muted hover:text-ink-secondary"
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm">Click to choose an image</span>
          </button>
        ) : (
          <div className="flex gap-4 items-start">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border border-border shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink-primary font-medium truncate">{file.name}</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={cn(inputClass, "mt-2 inline-flex items-center gap-1.5")}
              >
                <X className="w-3.5 h-3.5" />
                Change file
              </button>
            </div>
          </div>
        )}
      </div>

      {file && (
        <>
          {/* ── Metadata fields ── */}
          <Field
            label="Destination folder"
            name="folder"
            value={folder}
            onChange={setFolder}
            placeholder="places/japan-2024"
            hint='Optional. Determines the R2 path and auto-assigns a gallery. Use "places/…" or "themes/…".'
          />

          <Field
            label="Title"
            name="title"
            value={title}
            onChange={setTitle}
            placeholder="Sunset over the bay"
          />

          <Field
            label="Date taken"
            name="takenAt"
            value={takenAt}
            onChange={setTakenAt}
            placeholder="2024-03-15"
            type="date"
            hint="Auto-filled from EXIF if available."
          />

          <Field
            label="Location (display text)"
            name="location"
            value={location}
            onChange={setLocation}
            placeholder="Tokyo, Japan"
          />

          {/* ── Tags ── */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-ink-secondary mb-1" htmlFor="tags">
                Tags
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="landscape, golden-hour, long-exposure"
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-ink-primary text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-muted"
              />
              <p className="text-xs text-ink-muted mt-1">Separadas por comas.</p>
            </div>

            {/* ── Suggested tags ── visible as soon as there are exif tags */}
            {exifTags.length > 0 && (() => {
              // Merge exif + ai, deduplicated
              const seen = new Set<string>();
              const allSuggestions = [...exifTags, ...aiTags].filter((t) => {
                const k = t.toLowerCase();
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              });
              const activeTags = currentTagSet();

              return (
                <div className="rounded-lg border border-border bg-surface-1 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-medium text-ink-secondary">Etiquetas sugeridas</span>
                    {suggestingTags && (
                      <Loader2 className="w-3 h-3 animate-spin text-ink-muted ml-auto" />
                    )}
                  </div>

                  {allSuggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {allSuggestions.map((tag) => {
                        const added = activeTags.has(tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addSuggestion(tag)}
                            disabled={added}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all border",
                              added
                                ? "bg-accent/10 border-accent/30 text-accent/50 cursor-default"
                                : "bg-surface-2 border-border text-ink-muted hover:border-accent hover:text-accent"
                            )}
                          >
                            {added && <Check className="w-3 h-3" />}
                            {tag}
                          </button>
                        );
                      })}
                      {suggestingTags && (
                        <span className="text-xs text-ink-muted self-center">Analizando con IA…</span>
                      )}
                    </div>
                  ) : suggestingTags ? (
                    <p className="text-xs text-ink-muted">Analizando imagen con IA…</p>
                  ) : (
                    <p className="text-xs text-ink-muted">
                      Sin sugerencias disponibles.
                      {suggestError && <span className="text-red-400 ml-1">{suggestError}</span>}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── GPS ── */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Latitude"
              name="lat"
              value={lat}
              onChange={setLat}
              type="number"
              step="any"
              placeholder="43.2630"
              hint="Auto-filled from EXIF."
            />
            <Field
              label="Longitude"
              name="lng"
              value={lng}
              onChange={setLng}
              type="number"
              step="any"
              placeholder="-2.9350"
            />
          </div>

          {/* ── Status messages ── */}
          {errorMsg && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploadStatus === "uploading"}
              className="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-medium
                         hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {uploadStatus === "uploading" ? "Subiendo…" : "Subir foto"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className={cn(inputClass, "px-4")}
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
