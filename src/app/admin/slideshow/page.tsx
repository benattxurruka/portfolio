import { AdminHeader } from "@/components/admin/AdminHeader";
import { SlideshowPicker } from "@/components/admin/SlideshowPicker";
import { getPhotos, getPhotoUrl } from "@/lib/r2/photos";
import { getSlideshowConfig } from "@/lib/r2/slideshowConfig";

export const metadata = { title: "Admin — Slideshow" };
export const revalidate = 0;

export default async function AdminSlideshowPage() {
  const [photos, savedKeys] = await Promise.all([
    getPhotos(),
    getSlideshowConfig(),
  ]);

  const photoItems = photos.map((p) => ({
    r2Key: p.r2Key,
    url: getPhotoUrl(p.r2Key, p.updatedAt),
    title: p.title,
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminHeader activeTab="slideshow" />
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-primary">Home Slideshow</h1>
        <p className="text-sm text-ink-muted mt-1">
          Choose and order the photos shown in the home page slideshow.
          Hover over a selected photo to reorder or remove it.
        </p>
      </div>
      <SlideshowPicker photos={photoItems} savedKeys={savedKeys} />
    </div>
  );
}
