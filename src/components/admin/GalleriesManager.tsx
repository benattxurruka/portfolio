"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, X, Check, Lock, Unlock, FolderOpen, Eye, EyeOff,
} from "lucide-react";
import type { Gallery } from "@/lib/r2/types";
import type { GalleryConfig } from "@/lib/r2/types";
import { upsertGallery, deleteGallery } from "@/actions/galleryConfig";
import type { GalleryActionState } from "@/actions/galleryConfig";

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-surface border border-border text-ink-primary text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-muted";

// ── Slug helpers ──────────────────────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Gallery form (shared by add and edit) ─────────────────────────────────────

interface GalleryFormProps {
  /** When editing, the full gallery. When creating, undefined. */
  gallery?: Gallery;
  hasConfigEntry?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function GalleryForm({ gallery, onSuccess, onCancel }: GalleryFormProps) {
  const isEditing = !!gallery;
  const [state, formAction, isPending] = useActionState<GalleryActionState, FormData>(
    upsertGallery,
    {}
  );
  const calledSuccess = useRef(false);

  const [isPrivate, setIsPrivate] = useState(gallery?.isPrivate ?? false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(gallery?.name ?? "");
  const [slug, setSlug] = useState(gallery?.id ?? "");
  const [slugEdited, setSlugEdited] = useState(isEditing);

  useEffect(() => {
    if (state.success && !calledSuccess.current) {
      calledSuccess.current = true;
      onSuccess();
    }
  }, [state.success, onSuccess]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (!slugEdited) {
      setSlug(nameToSlug(e.target.value));
    }
  }

  return (
    <form
      action={formAction}
      className="space-y-4 p-4 bg-surface-2 rounded-xl border border-border"
    >
      {/* Hidden gallery ID */}
      <input type="hidden" name="galleryId" value={isEditing ? gallery.id : slug} />

      {state.error && (
        <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}

      {/* Display name */}
      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">
          Display name <span className="text-red-400">*</span>
        </label>
        <input
          name="name"
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Boda Marc & Anna"
          className={inputClass}
          required
        />
      </div>

      {/* Slug — only editable when creating */}
      {!isEditing && (
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">
            URL slug{" "}
            <span className="font-normal text-ink-muted/70">
              (used in /photography/…)
            </span>
          </label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            placeholder="boda-marc-anna"
            className={inputClass}
            readOnly
          />
          <p className="text-xs text-ink-muted mt-1">
            Auto-derived from name. Lowercase, hyphens only.
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-ink-muted mb-1.5">
          Description{" "}
          <span className="font-normal text-ink-muted/70">(optional)</span>
        </label>
        <input
          name="description"
          defaultValue={gallery?.description ?? ""}
          placeholder="A short description shown below the gallery title"
          className={inputClass}
        />
      </div>

      {/* Private toggle */}
      <div>
        <label className="block text-xs font-medium text-ink-muted mb-2">
          Visibility
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPrivate(false)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              !isPrivate
                ? "bg-accent/10 border-accent text-accent"
                : "bg-surface border-border text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            Public
          </button>
          <button
            type="button"
            onClick={() => setIsPrivate(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              isPrivate
                ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                : "bg-surface border-border text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Private
          </button>
        </div>
        <input type="hidden" name="private" value={isPrivate ? "true" : "false"} />
      </div>

      {/* Password — only shown when private */}
      {isPrivate && (
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">
            Password{" "}
            {isEditing && (
              <span className="font-normal text-ink-muted/70">
                (leave blank to keep existing)
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              placeholder={isEditing ? "••••••••" : "Set a password"}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted
                         hover:text-ink-primary transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white
                     text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface
                     border border-border text-ink-secondary text-sm
                     hover:text-ink-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Delete button ─────────────────────────────────────────────────────────────

function DeleteConfigButton({
  galleryId,
  onSuccess,
}: {
  galleryId: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState<GalleryActionState, FormData>(
    deleteGallery,
    {}
  );
  const calledSuccess = useRef(false);

  useEffect(() => {
    if (state.success && !calledSuccess.current) {
      calledSuccess.current = true;
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction}>
      <input type="hidden" name="galleryId" value={galleryId} />
      <button
        type="submit"
        disabled={isPending}
        title="Remove config override"
        className="p-1.5 rounded-md text-ink-muted hover:text-red-400 hover:bg-red-400/10
                   disabled:opacity-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  );
}

// ── Gallery row ───────────────────────────────────────────────────────────────

function GalleryRow({
  gallery,
  hasConfigEntry,
  isEditing,
  onEditStart,
  onSuccess,
}: {
  gallery: Gallery;
  hasConfigEntry: boolean;
  isEditing: boolean;
  onEditStart: () => void;
  onSuccess: () => void;
}) {
  if (isEditing) {
    return (
      <div className="rounded-xl border border-accent/40 overflow-hidden">
        <GalleryForm
          gallery={gallery}
          hasConfigEntry={hasConfigEntry}
          onSuccess={onSuccess}
          onCancel={onSuccess}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <FolderOpen className="w-4 h-4 text-accent shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink-primary truncate">
              {gallery.name}
            </span>
            {gallery.isPrivate ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
                               bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Lock className="w-2.5 h-2.5" />
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
                               bg-surface-3 text-ink-muted border border-border shrink-0">
                Public
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-xs text-ink-muted font-mono">{gallery.id}</code>
            <span className="text-xs text-ink-muted">·</span>
            <span className="text-xs text-ink-muted">
              {gallery.photoCount === 0 ? "No photos" : `${gallery.photoCount} photo${gallery.photoCount !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEditStart}
            title="Edit"
            className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary
                       hover:bg-surface-3 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {hasConfigEntry && (
            <DeleteConfigButton galleryId={gallery.id} onSuccess={onSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  galleries: Gallery[];
  galleryConfig: GalleryConfig;
}

export function GalleriesManager({ galleries, galleryConfig }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSuccess = useCallback(() => {
    setEditingId(null);
    setShowAddForm(false);
    router.refresh();
  }, [router]);

  // Separate "all" gallery (always synthetic, no config)
  const manageable = galleries.filter((g) => g.id !== "all");

  return (
    <div className="space-y-6">
      {/* Add new gallery */}
      {showAddForm ? (
        <GalleryForm
          onSuccess={handleSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed
                     border-border text-ink-muted text-sm hover:border-accent hover:text-accent
                     transition-colors"
        >
          <Plus className="w-4 h-4" />
          New gallery
        </button>
      )}

      {/* Gallery list */}
      {manageable.length > 0 ? (
        <section>
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
            Galleries ({manageable.length})
          </h2>
          <div className="space-y-2">
            {manageable.map((gallery) => (
              <GalleryRow
                key={gallery.id}
                gallery={gallery}
                hasConfigEntry={gallery.id in galleryConfig}
                isEditing={editingId === gallery.id}
                onEditStart={() => setEditingId(gallery.id)}
                onSuccess={handleSuccess}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-ink-muted py-8 text-center">
          No galleries found. Upload photos or create a new gallery above.
        </p>
      )}

      <p className="text-xs text-ink-muted border-t border-border pt-4">
        Deleting a gallery config entry only removes the name/privacy overrides — photos
        are not affected and public galleries derived from photo metadata will continue
        to appear.
      </p>
    </div>
  );
}
