import { GalleryCard } from "./GalleryCard";
import type { Gallery } from "@/lib/r2/types";

interface Props {
  galleries: Gallery[];
  featured?: boolean;
}

export function GalleryGrid({ galleries, featured = false }: Props) {
  if (featured) {
    return (
      <div className="space-y-4">
        {galleries.map((g) => (
          <GalleryCard key={g.id} gallery={g} featured />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {galleries.map((g) => (
        <GalleryCard key={g.id} gallery={g} />
      ))}
    </div>
  );
}
