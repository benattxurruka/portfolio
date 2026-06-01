import { AdminHeader } from "@/components/admin/AdminHeader";
import { InboxMessage } from "@/components/admin/InboxMessage";
import { getMessages } from "@/lib/r2/messages";

export const metadata = { title: "Admin — Inbox" };
export const revalidate = 0;

export default async function AdminInboxPage() {
  const messages = await getMessages();

  // Sort newest first
  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <AdminHeader activeTab="inbox" />

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-ink-primary">Inbox</h1>
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-semibold">
            {unreadCount} sin leer
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-ink-muted">
          <p className="text-lg">No hay mensajes todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((msg) => (
            <InboxMessage key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}
