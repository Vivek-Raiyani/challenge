import Papa from "papaparse";

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fatalError = results.errors.find((error) => error.type !== "FieldMismatch");
        if (fatalError) {
          reject(new Error(fatalError.message || "Failed to parse CSV"));
          return;
        }

        const rows = results.data.filter((row) =>
          Object.values(row).some((value) => value?.trim())
        );

        if (rows.length === 0) {
          reject(new Error("CSV file is empty or contains no data rows"));
          return;
        }

        const headers =
          results.meta.fields?.filter(Boolean) ??
          Object.keys(rows[0] ?? {});

        resolve({ headers, rows });
      },
      error: (error) => {
        reject(new Error(error.message || "Failed to parse CSV"));
      },
    });
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
