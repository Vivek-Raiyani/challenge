"use client";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Try Again",
}: ErrorBannerProps) {
  return (
    <section className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/60 dark:bg-red-950/40">
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/60"
        >
          {retryLabel}
        </button>
      )}
    </section>
  );
}
