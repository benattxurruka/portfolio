export default function TagGalleryLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back link skeleton */}
      <div className="h-4 w-28 rounded bg-surface-2 animate-pulse mb-8" />

      {/* Title skeleton */}
      <div className="mb-8">
        <div className="h-8 w-40 rounded-lg bg-surface-2 animate-pulse mb-2" />
        <div className="h-4 w-24 rounded bg-surface-2 animate-pulse" />
      </div>

      {/* Spinner */}
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-ink-muted">
        <svg
          className="w-10 h-10 animate-spin text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm">Loading photos…</p>
      </div>
    </div>
  );
}
