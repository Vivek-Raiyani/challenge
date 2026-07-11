"use client";

import { useEffect, useState } from "react";
import CsvPreviewTable from "../components/CsvPreviewTable";
import ErrorBanner from "../components/ErrorBanner";
import FileUpload from "../components/FileUpload";
import ImportResults from "../components/ImportResults";
import LoadingOverlay from "../components/LoadingOverlay";
import ThemeToggle from "../components/ThemeToggle";
import { checkBackendHealth, importCsv } from "../lib/api";
import { parseCsvFile } from "../lib/csv";
import type { ImportResponse } from "../types/crm";

type AppState = "idle" | "preview" | "processing" | "results" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    void checkBackendHealth().then(setBackendOnline);
  }, []);

  const reset = () => {
    setAppState("idle");
    setRawFile(null);
    setRawRows([]);
    setHeaders([]);
    setImportResult(null);
    setErrorMessage(null);
  };

  const handleFileSelect = async (file: File) => {
    try {
      setErrorMessage(null);
      setImportResult(null);
      const parsed = await parseCsvFile(file);
      setRawFile(file);
      setRawRows(parsed.rows);
      setHeaders(parsed.headers);
      setAppState("preview");
      if (process.env.NODE_ENV === "development") {
        console.log("[frontend] CSV parsed", {
          file: file.name,
          rows: parsed.rows.length,
          columns: parsed.headers.length,
        });
      }
    } catch (error) {
      setAppState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to parse CSV file"
      );
    }
  };

  const handleConfirmImport = async () => {
    if (!rawFile) return;

    try {
      setErrorMessage(null);
      setAppState("processing");
      const result = await importCsv(rawFile);
      setImportResult(result);
      setAppState("results");
      setBackendOnline(true);
    } catch (error) {
      setAppState("preview");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to import CSV"
      );
    }
  };

  const handleRetry = () => {
    if (rawFile) {
      void handleConfirmImport();
      return;
    }
    reset();
  };

  const showUploadSection = appState !== "results";
  const showPreview =
    rawFile && (appState === "preview" || appState === "processing");
  const showImportError = Boolean(errorMessage && appState === "preview");
  const showParseError = Boolean(errorMessage && appState === "error");

  return (
    <div className="min-h-full bg-gradient-to-b from-[#eef2f2] via-[#f4f6f6] to-[#ecefef] dark:from-[#1a2222] dark:via-[#151a1a] dark:to-[#121818]">
      {appState === "processing" && <LoadingOverlay />}

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <header className="relative space-y-4 pb-4">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <p className="text-sm font-medium uppercase tracking-widest text-[#5a7a7a] dark:text-[#8aabab]">
            GrowEasy CRM
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Import Leads via CSV
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Upload a CSV file to preview your data, then confirm to let AI map
            columns into GrowEasy CRM format.
          </p>
        </header>

        {backendOnline === false && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            Backend is not reachable. Start the API server on port 4000 before
            confirming an import.
          </section>
        )}

        {showUploadSection && (
          <section className="rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/90">
            <FileUpload
              selectedFile={rawFile}
              onFileSelect={handleFileSelect}
              onCancel={reset}
              onInvalidFile={(message) => {
                setErrorMessage(message);
                setAppState("error");
              }}
              disabled={appState === "processing"}
            />
          </section>
        )}

        {showImportError && errorMessage && (
          <ErrorBanner
            message={errorMessage}
            onRetry={handleRetry}
            retryLabel="Retry Import"
          />
        )}

        {showPreview && (
          <section className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/90">
            <CsvPreviewTable headers={headers} rows={rawRows} />
            {appState === "preview" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleConfirmImport()}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                >
                  Confirm Import
                </button>
              </div>
            )}
          </section>
        )}

        {showParseError && errorMessage && (
          <ErrorBanner message={errorMessage} onRetry={handleRetry} />
        )}

        {appState === "results" && importResult && (
          <section className="rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/90">
            <ImportResults result={importResult} onImportAnother={reset} />
          </section>
        )}
      </main>
    </div>
  );
}
