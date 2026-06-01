import { AdminHeader } from "@/components/admin/AdminHeader";
import { PhotoUploadForm } from "@/components/admin/PhotoUploadForm";

export const metadata = { title: "Admin — Upload photo" };

export default function AdminUploadPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <AdminHeader activeTab="upload" />
      <h1 className="text-xl font-semibold text-ink-primary mb-6">Upload photo</h1>
      <PhotoUploadForm />
    </div>
  );
}
