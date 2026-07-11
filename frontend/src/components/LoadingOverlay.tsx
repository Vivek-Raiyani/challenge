export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm dark:bg-black/60">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-700">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-cyan-500" />
        <p className="text-center text-base font-medium text-zinc-900 dark:text-zinc-100">
          AI is mapping your columns…
        </p>
        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          This may take a moment for larger files.
        </p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-600 dark:bg-cyan-500" />
        </div>
      </div>
    </div>
  );
}
