interface CsvPreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  maxRows?: number;
}

export default function CsvPreviewTable({
  headers,
  rows,
  maxRows = 50,
}: CsvPreviewTableProps) {
  const visibleRows = rows.slice(0, maxRows);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Preview
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {visibleRows.length} of {rows.length} rows
        </p>
      </div>

      <div className="overflow-auto max-h-96 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap border-b border-zinc-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-zinc-100 last:border-b-0 odd:bg-white even:bg-zinc-50/60 dark:border-zinc-800 dark:odd:bg-zinc-900 dark:even:bg-zinc-800/40"
              >
                {headers.map((header) => (
                  <td
                    key={`${rowIndex}-${header}`}
                    className="whitespace-nowrap px-4 py-2.5 text-zinc-700 dark:text-zinc-300"
                  >
                    {row[header] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
