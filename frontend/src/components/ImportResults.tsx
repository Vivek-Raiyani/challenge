"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import type { ImportResponse } from "../types/crm";

const CRM_COLUMNS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

interface ImportResultsProps {
  result: ImportResponse;
  onImportAnother: () => void;
}

function downloadImportedCsv(result: ImportResponse) {
  const csv = Papa.unparse(
    result.imported.map((lead) =>
      Object.fromEntries(
        CRM_COLUMNS.map((column) => [column, lead[column] ?? ""])
      )
    )
  );

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "groweasy-imported-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ImportResults({
  result,
  onImportAnother,
}: ImportResultsProps) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">(
    result.imported.length > 0 ? "imported" : "skipped"
  );

  const visibleImported = useMemo(
    () => result.imported.slice(0, 50),
    [result.imported]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/60 dark:bg-green-950/40">
          <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
            Imported
          </p>
          <p className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-100">
            {result.stats.imported}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/40">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Skipped
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-900 dark:text-amber-100">
            {result.stats.skipped}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Total Rows
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {result.stats.total}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/60">
          <button
            type="button"
            onClick={() => setActiveTab("imported")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeTab === "imported"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Imported ({result.imported.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("skipped")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeTab === "skipped"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Skipped ({result.skipped.length})
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {result.imported.length > 0 && (
            <button
              type="button"
              onClick={() => downloadImportedCsv(result)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Download CSV
            </button>
          )}
          <button
            type="button"
            onClick={onImportAnother}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
          >
            Import Another File
          </button>
        </div>
      </div>

      {activeTab === "imported" ? (
        result.imported.length > 0 ? (
          <div className="space-y-3">
            {result.imported.length > 50 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Showing 50 of {result.imported.length} imported records
              </p>
            )}
            <div className="overflow-auto max-h-96 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    {CRM_COLUMNS.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap border-b border-zinc-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleImported.map((lead, index) => (
                    <tr
                      key={index}
                      className="border-b border-zinc-100 last:border-b-0 odd:bg-white even:bg-zinc-50/60 dark:border-zinc-800 dark:odd:bg-zinc-900 dark:even:bg-zinc-800/40"
                    >
                      {CRM_COLUMNS.map((column) => (
                        <td
                          key={column}
                          className="whitespace-nowrap px-4 py-2.5 text-zinc-700 dark:text-zinc-300"
                        >
                          {lead[column] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
            No records were imported.
          </p>
        )
      ) : result.skipped.length > 0 ? (
        <div className="overflow-auto max-h-96 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="border-b border-zinc-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  Row
                </th>
                <th className="border-b border-zinc-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  Reason
                </th>
                <th className="border-b border-zinc-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  Raw Data
                </th>
              </tr>
            </thead>
            <tbody>
              {result.skipped.map((item) => (
                <tr
                  key={item.rowIndex}
                  className="border-b border-zinc-100 last:border-b-0 odd:bg-white even:bg-zinc-50/60 dark:border-zinc-800 dark:odd:bg-zinc-900 dark:even:bg-zinc-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                    {item.rowIndex + 1}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">{item.reason}</td>
                  <td className="max-w-md truncate px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
                    {Object.entries(item.raw)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
          No records were skipped.
        </p>
      )}
    </div>
  );
}
