import { extractBatch } from "./aiExtractor";
import { validateRecord } from "../utils/validateRecord";
import type { ImportResponse } from "../types/crm";

function getBatchSize(): number {
  const size = Number(process.env.BATCH_SIZE);
  return Number.isFinite(size) && size > 0 ? size : 15;
}

export async function processImport(
  rows: Record<string, string>[]
): Promise<ImportResponse> {
  const batchSize = getBatchSize();
  const imported: ImportResponse["imported"] = [];
  const skipped: ImportResponse["skipped"] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(rows.length / batchSize);

    console.log(
      `[import] processing batch ${batchNumber}/${totalBatches} (rows ${i + 1}-${i + batch.length})`
    );

    const aiRecords = await extractBatch(batch, i);

    const recordsByIndex = new Map(
      aiRecords.map((record) => [record._rowIndex, record])
    );

    for (let j = 0; j < batch.length; j++) {
      const rowIndex = i + j;
      const raw = batch[j]!;
      const aiRecord = recordsByIndex.get(rowIndex);

      if (!aiRecord) {
        skipped.push({
          rowIndex,
          raw,
          reason: "No AI result returned for this row",
        });
        continue;
      }

      const result = validateRecord(aiRecord, raw);
      if (result.lead) {
        imported.push(result.lead);
      } else if (result.skipped) {
        skipped.push(result.skipped);
      }
    }
  }

  return {
    imported,
    skipped,
    stats: {
      total: rows.length,
      imported: imported.length,
      skipped: skipped.length,
    },
  };
}
