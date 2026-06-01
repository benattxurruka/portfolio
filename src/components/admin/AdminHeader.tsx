import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminLogout } from "@/actions/adminAuth";
import { getCachedMessages } from "@/lib/r2/messages";

interface Props {
  activeTab: "photos" | "tags" | "upload" | "inbox";
}

export async function AdminHeader({ activeTab }: Props) {
  let unreadCount = 0;
  try {
    const messages = await getCachedMessages();
    unreadCount = messages.filter((m) => !m.read).length;
  } catch {
    // Don't fail the page if messages can't be fetched
  }

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
          <Link
            href="/admin/photos/upload"
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeTab === "upload"
                ? "bg-surface-2 text-ink-primary font-medium"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            Upload
          </Link>
          <Link
            href="/admin/inbox"
            className={`relative px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeTab === "inbox"
                ? "bg-surface-2 text-ink-primary font-medium"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            Inbox
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center rounded-full bg-red-500 text-white text-[0.6rem] font-bold leading-none px-0.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
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
