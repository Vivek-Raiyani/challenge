import { parse } from "csv-parse/sync";

export function parseCsvBuffer(buffer: Buffer): Record<string, string>[] {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  if (records.length === 0) {
    throw new Error("CSV file is empty or contains no data rows");
  }

  return records;
}
