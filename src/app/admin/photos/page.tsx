import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getPhotos, getPhotoUrl } from "@/lib/r2/photos";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const metadata = { title: "Admin — Photos" };
export const revalidate = 0;

function encodePhotoId(id: string) {
  return Buffer.from(id).toString("base64url");
}

export default async function AdminPhotosPage() {
  const photos = await getPhotos();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminHeader activeTab="photos" />
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-ink-primary">
          Photo Metadata
        </h1>
        <span className="text-sm text-ink-muted">({photos.length})</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {photos.map((photo) => (
          <Link
            key={photo.id}
            href={`/admin/photos/${encodePhotoId(photo.id)}`}
            className="group relative overflow-hidden rounded-lg bg-surface-2 aspect-square
                       hover:ring-2 hover:ring-accent/60 transition-all"
          >
            <Image
              src={getPhotoUrl(photo.r2Key)}
              alt={photo.title}
              fill
              draggable={false}
              className="object-cover select-none"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading="lazy"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Missing metadata indicator */}
            {(!photo.title || photo.title === photo.id) && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" title="Missing title" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
