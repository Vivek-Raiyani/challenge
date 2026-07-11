"use client";

import { useRef, useState } from "react";
import { formatFileSize } from "../lib/csv";

interface FileUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onCancel: () => void;
  onInvalidFile?: (message: string) => void;
  disabled?: boolean;
}

export default function FileUpload({
  selectedFile,
  onFileSelect,
  onCancel,
  onInvalidFile,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      onInvalidFile?.("Please upload a valid CSV file.");
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {selectedFile.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatFileSize(selectedFile.size)}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
        isDragging
          ? "border-blue-500 bg-blue-50 dark:border-cyan-500 dark:bg-cyan-950/30"
          : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900/50 dark:hover:border-zinc-500"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !disabled) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl dark:bg-zinc-800">
        ↑
      </div>
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
        Drag & drop your CSV file here
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">or click to browse</p>
      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">CSV files only · Max 5MB</p>
    </div>
  );
}
