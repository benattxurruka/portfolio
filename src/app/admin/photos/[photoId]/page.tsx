import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getPhotos, getPhotoUrl } from "@/lib/r2/photos";
import { updatePhoto } from "@/actions/updatePhoto";
import { deriveGalleries } from "@/lib/utils/galleries";
import { PhotoEditForm } from "./PhotoEditForm";

export const revalidate = 0;

interface Props {
  params: Promise<{ photoId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { photoId } = await params;
  const id = Buffer.from(photoId, "base64url").toString();
  return { title: `Edit — ${id}` };
}

export default async function AdminPhotoEditPage({ params }: Props) {
  const { photoId } = await params;
  const id = Buffer.from(photoId, "base64url").toString();

  const photos = await getPhotos();
  const photo = photos.find((p) => p.id === id);
  if (!photo) notFound();

  const allGalleries = deriveGalleries(photos);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/admin/photos"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> All photos
      </Link>

      <div className="flex gap-6 mb-8">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden shrink-0 bg-surface-2">
          <Image
            src={getPhotoUrl(photo.r2Key)}
            alt={photo.title}
            fill
            draggable={false}
            className="object-cover select-none"
            sizes="128px"
          />
        </div>
        <div>
          <p className="text-xs text-ink-muted font-mono break-all">{photo.r2Key}</p>
          <p className="text-xs text-ink-muted mt-1">
            {photo.width && photo.height ? `${photo.width} × ${photo.height}px` : "Dimensions unknown"}
          </p>
        </div>
      </div>

      <PhotoEditForm photo={photo} allGalleries={allGalleries} action={updatePhoto} />
    </div>
  );
}
