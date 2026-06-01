import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { getPhotos, getPhotoUrl } from "@/lib/r2/photos";
import { updatePhoto } from "@/actions/updatePhoto";
import { deriveGalleries } from "@/lib/utils/galleries";
import { PhotoEditForm } from "./PhotoEditForm";
import { ReplacePhotoSection } from "@/components/admin/ReplacePhotoSection";
import { DeletePhotoButton } from "@/components/admin/DeletePhotoButton";

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

  const photoIndex = photos.findIndex((p) => p.id === id);
  const encode = (pid: string) => Buffer.from(pid).toString("base64url");
  const prevPhoto = photoIndex > 0 ? photos[photoIndex - 1] : null;
  const nextPhoto = photoIndex < photos.length - 1 ? photos[photoIndex + 1] : null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/admin/photos"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All photos
        </Link>

        <div className="flex items-center gap-1">
          {prevPhoto ? (
            <Link
              href={`/admin/photos/${encode(prevPhoto.id)}`}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-surface-2 transition-colors"
              title={prevPhoto.title || prevPhoto.id}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-1.5 text-ink-muted/30"><ChevronLeft className="w-4 h-4" /></span>
          )}

          <span className="text-xs text-ink-muted px-1 tabular-nums">
            {photoIndex + 1} / {photos.length}
          </span>

          {nextPhoto ? (
            <Link
              href={`/admin/photos/${encode(nextPhoto.id)}`}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-surface-2 transition-colors"
              title={nextPhoto.title || nextPhoto.id}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-1.5 text-ink-muted/30"><ChevronRight className="w-4 h-4" /></span>
          )}
        </div>
      </div>

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

      <hr className="border-border my-8" />

      <div className="space-y-6">
        <ReplacePhotoSection r2Key={photo.r2Key} />
        <div className="border-t border-border pt-6">
          <DeletePhotoButton r2Key={photo.r2Key} />
        </div>
      </div>
    </div>
  );
}
