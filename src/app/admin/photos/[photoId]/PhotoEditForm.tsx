"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import type { Gallery, Photo } from "@/lib/r2/types";
import type { UpdatePhotoState } from "@/actions/updatePhoto";
import { cn } from "@/lib/utils/cn";

interface Props {
  photo: Photo;
  allGalleries: Gallery[];
  action: (prev: UpdatePhotoState, formData: FormData) => Promise<UpdatePhotoState>;
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  type = "text",
  step,
  textarea,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  step?: string;
  textarea?: boolean;
}) {
  const base =
    "w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-ink-primary text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-muted";
  return (
    <div>
      <label className="block text-sm text-ink-secondary mb-1" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={base + " resize-y"}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          step={step}
          className={base}
        />
      )}
      {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}

// ── Gallery picker ────────────────────────────────────────────────────────────

function prettifySlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function GalleriesField({
  photo,
  allGalleries,
}: {
  photo: Photo;
  allGalleries: Gallery[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(photo.galleries)
  );
  const [coverFor, setCoverFor] = useState<Set<string>>(
    new Set(photo.coverFor ?? [])
  );
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState<"places" | "themes">("places");

  // Exclude the auto-generated "all" gallery — it's not a real membership
  const pickable = allGalleries.filter((g) => g.id !== "all");
  const existingIds = new Set(pickable.map((g) => g.id));

  // Galleries added this session that don't exist yet
  const brandNew = [...selected].filter((id) => !existingIds.has(id));

  function toggleGallery(id: string) {
    const removing = selected.has(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (removing) next.delete(id);
      else next.add(id);
      return next;
    });
    if (removing) {
      const slug = id.split("/").pop()!;
      setCoverFor((prev) => {
        const next = new Set(prev);
        next.delete(id);
        next.delete(slug);
        return next;
      });
    }
  }

  function addNewGallery() {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    const id = `${newType}/${slug}`;
    setSelected((prev) => new Set([...prev, id]));
    setNewSlug("");
  }

  function toggleCover(galleryId: string) {
    setCoverFor((prev) => {
      const next = new Set(prev);
      if (next.has(galleryId)) next.delete(galleryId);
      else next.add(galleryId);
      return next;
    });
  }

  const inputClass =
    "px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-ink-primary text-xs " +
    "focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-muted";

  const pillBase =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border";
  const pillOn = "bg-accent/20 border-accent text-accent";
  const pillOff =
    "bg-surface-2 border-border text-ink-muted hover:border-accent/50 hover:text-ink-secondary";

  const groups = [
    { type: "favourites" as const, label: "Favourites" },
    { type: "places" as const, label: "Places" },
    { type: "themes" as const, label: "Themes" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Existing galleries ── */}
      <div>
        <p className="block text-sm text-ink-secondary mb-2">Galleries</p>

        {pickable.length > 0 ? (
          <div className="space-y-2">
            {groups.map(({ type, label }) => {
              const items = pickable.filter((g) => g.type === type);
              if (items.length === 0) return null;
              return (
                <div key={type}>
                  <p className="text-xs text-ink-muted uppercase tracking-wide mb-1.5">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGallery(g.id)}
                        className={cn(
                          pillBase,
                          selected.has(g.id) ? pillOn : pillOff
                        )}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-ink-muted mb-2">No galleries yet.</p>
        )}

        {/* Newly created this session (not yet derived from any photo) */}
        {brandNew.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {brandNew.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleGallery(id)}
                className={cn(pillBase, pillOn)}
                title="Click to remove"
              >
                {id} ×
              </button>
            ))}
          </div>
        )}

        {/* Add new gallery */}
        <div className="flex gap-2 mt-3">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as "places" | "themes")}
            className={inputClass}
          >
            <option value="places">places</option>
            <option value="themes">themes</option>
          </select>
          <input
            type="text"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNewGallery();
              }
            }}
            placeholder="new-gallery-slug"
            className={cn(inputClass, "flex-1")}
          />
          <button
            type="button"
            onClick={addNewGallery}
            disabled={!newSlug.trim()}
            className={cn(
              inputClass,
              "hover:border-accent hover:text-accent disabled:opacity-40 transition-colors text-ink-secondary"
            )}
          >
            Add
          </button>
        </div>
        <p className="text-xs text-ink-muted mt-1">
          Spaces become dashes; slug is lowercased automatically.
        </p>
      </div>

      {/* Hidden serialised value */}
      <input type="hidden" name="galleries" value={[...selected].join(", ")} />

      {/* ── Cover photo picker ── */}
      <div>
        <p className="block text-sm text-ink-secondary mb-1">Cover photo for</p>

        {selected.size === 0 ? (
          <p className="text-xs text-ink-muted">
            Add the photo to at least one gallery above to set it as a cover.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...selected].map((id) => {
              const slug = id.split("/").pop() ?? id;
              const isCover = coverFor.has(id) || coverFor.has(slug);
              const name =
                id === "favourites" ? "Favourites" : prettifySlug(slug);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCover(id)}
                  className={cn(
                    pillBase,
                    isCover ? pillOn : pillOff
                  )}
                  title={
                    isCover ? `Remove cover for ${id}` : `Set as cover for ${id}`
                  }
                >
                  <Star className={cn("w-3 h-3", isCover && "fill-accent")} />
                  {name}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-ink-muted mt-1">
          Starred galleries will use this photo as their preview image on the
          Photography page.
        </p>
        <input type="hidden" name="coverFor" value={[...coverFor].join(", ")} />
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function PhotoEditForm({ photo, allGalleries, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="r2Key" value={photo.r2Key} />

      <Field
        label="Title"
        name="title"
        defaultValue={photo.title !== photo.id ? photo.title : ""}
        placeholder="e.g. Sunset over the bay"
      />

      <Field
        label="Description"
        name="description"
        defaultValue={photo.description}
        placeholder="A short caption shown in the lightbox"
        textarea
      />

      <Field
        label="Tags"
        name="tags"
        defaultValue={photo.tags?.join(", ")}
        placeholder="landscape, golden-hour, long-exposure"
        hint="Comma-separated. Used as filters on the Photography page."
      />

      <Field
        label="Location (display text)"
        name="location"
        defaultValue={photo.location}
        placeholder="e.g. Tokyo, Japan"
        hint="Shown with a pin icon in the lightbox."
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Latitude"
          name="lat"
          type="number"
          step="any"
          defaultValue={photo.lat?.toString()}
          placeholder="43.2630"
          hint="Decimal degrees. Enables the map."
        />
        <Field
          label="Longitude"
          name="lng"
          type="number"
          step="any"
          defaultValue={photo.lng?.toString()}
          placeholder="-2.9350"
        />
      </div>

      <GalleriesField photo={photo} allGalleries={allGalleries} />

      {state.error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
          Saved successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium
                   hover:bg-accent/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
