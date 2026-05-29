import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminLogout } from "@/actions/adminAuth";

interface Props {
  activeTab: "photos" | "tags";
}

export function AdminHeader({ activeTab }: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to site
        </Link>

        <nav className="flex gap-1">
          <Link
            href="/admin/photos"
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeTab === "photos"
                ? "bg-surface-2 text-ink-primary font-medium"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            Photos
          </Link>
          <Link
            href="/admin/tags"
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeTab === "tags"
                ? "bg-surface-2 text-ink-primary font-medium"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            Tags
          </Link>
        </nav>
      </div>

      <form action={adminLogout}>
        <button
          type="submit"
          className="text-sm text-ink-muted hover:text-ink-primary transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
