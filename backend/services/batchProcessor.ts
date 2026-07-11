import { extractBatch } from "./aiExtractor";
import { validateRecord } from "../utils/validateRecord";
import type { ImportResponse } from "../types/crm";

function getBatchSize(): number {
  const size = Number(process.env.BATCH_SIZE);
  return Number.isFinite(size) && size > 0 ? size : 8;
}

function getParallelBatches(): number {
  const count = Number(process.env.PARALLEL_BATCHES);
  return Number.isFinite(count) && count > 0 ? count : 3;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processBatch(
  batch: Record<string, string>[],
  batchStart: number,
  batchNumber: number,
  totalBatches: number
): Promise<{ imported: ImportResponse["imported"]; skipped: ImportResponse["skipped"] }> {
  const imported: ImportResponse["imported"] = [];
  const skipped: ImportResponse["skipped"] = [];

  let aiRecords = await extractBatch(batch, batchStart);

  // Retry if the AI returned fewer records than we sent (under-generation)
  for (let attempt = 1; attempt < MAX_RETRIES && aiRecords.length < batch.length; attempt++) {
    const missing = batch.length - aiRecords.length;
    console.warn(
      `[import] batch ${batchNumber}/${totalBatches}: AI returned ${aiRecords.length}/${batch.length} records — retrying missing ${missing} rows (attempt ${attempt + 1}/${MAX_RETRIES})`
    );
    await sleep(RETRY_DELAY_MS * attempt);

    // Identify which rows were not returned and retry only those
    const returnedIndexes = new Set(aiRecords.map((r) => r._rowIndex));
    const missingRows = batch.filter((_, j) => !returnedIndexes.has(batchStart + j));
    const missingStart = batchStart + batch.findIndex((_, j) => !returnedIndexes.has(batchStart + j));

    try {
      const retryRecords = await extractBatch(missingRows, missingStart);
      aiRecords = [...aiRecords, ...retryRecords];
    } catch (err) {
      console.error(`[import] batch ${batchNumber}/${totalBatches}: retry attempt ${attempt + 1} failed`, err);
    }
  }

  const recordsByIndex = new Map(aiRecords.map((record) => [record._rowIndex, record]));

  for (let j = 0; j < batch.length; j++) {
    const rowIndex = batchStart + j;
    const raw = batch[j]!;
    const aiRecord = recordsByIndex.get(rowIndex);

    if (!aiRecord) {
      console.warn(`[import] batch ${batchNumber}/${totalBatches}: row ${rowIndex + 1} still missing after ${MAX_RETRIES} attempts — skipping`);
      skipped.push({
        rowIndex,
        raw,
        reason: `AI did not return a result after ${MAX_RETRIES} attempts`,
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

  return { imported, skipped };
}

export async function processImport(
  rows: Record<string, string>[]
): Promise<ImportResponse> {
  const batchSize = getBatchSize();
  const parallelBatches = getParallelBatches();
  const totalBatches = Math.ceil(rows.length / batchSize);

  // Split all rows into batch descriptors
  const batches: Array<{ batch: Record<string, string>[]; start: number; number: number }> = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push({
      batch: rows.slice(i, i + batchSize),
      start: i,
      number: Math.floor(i / batchSize) + 1,
    });
  }

  const allImported: ImportResponse["imported"] = [];
  const allSkipped: ImportResponse["skipped"] = [];

  // Process batches in parallel groups of `parallelBatches`
  for (let i = 0; i < batches.length; i += parallelBatches) {
    const group = batches.slice(i, i + parallelBatches);
    console.log(
      `[import] dispatching batches ${group[0]!.number}–${group[group.length - 1]!.number} of ${totalBatches} in parallel`
    );

    const results = await Promise.all(
      group.map(({ batch, start, number }) => {
        console.log(
          `[import] → batch ${number}/${totalBatches} (rows ${start + 1}–${start + batch.length})`
        );
        return processBatch(batch, start, number, totalBatches);
      })
    );

    for (const { imported, skipped } of results) {
      allImported.push(...imported);
      allSkipped.push(...skipped);
    }
  }

  return {
    imported: allImported,
    skipped: allSkipped,
    stats: {
      total: rows.length,
      imported: allImported.length,
      skipped: allSkipped.length,
    },
  };
}
