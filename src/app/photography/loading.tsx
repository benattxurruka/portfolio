export default function PhotographyLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border animate-pulse" />
          <div className="h-7 w-48 rounded-lg bg-surface-2 animate-pulse" />
        </div>
        <div className="h-4 w-64 rounded ml-14 bg-surface-2 animate-pulse" />
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
