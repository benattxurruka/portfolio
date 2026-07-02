import { AdminHeader } from "@/components/admin/AdminHeader";
import { GalleriesManager } from "@/components/admin/GalleriesManager";
import { getPhotos } from "@/lib/r2/photos";
import { getGalleryConfig } from "@/lib/r2/galleryConfig";
import { deriveGalleries } from "@/lib/utils/galleries";

export const metadata = { title: "Admin — Galleries" };
export const revalidate = 0;

export default async function AdminGalleriesPage() {
  const [photos, galleryConfig] = await Promise.all([
    getPhotos(),
    getGalleryConfig(),
  ]);

  // Include private / config-only galleries too (pass galleryConfig)
  const galleries = deriveGalleries(photos, {}, galleryConfig);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <AdminHeader activeTab="galleries" />
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-ink-primary">Galleries</h1>
        <span className="text-sm text-ink-muted">
          ({galleries.filter((g) => g.id !== "all").length})
        </span>
      </div>
      <GalleriesManager galleries={galleries} galleryConfig={galleryConfig} />
    </div>
  );
}
