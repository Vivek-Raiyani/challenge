import OpenAI from "openai";
import {
  CRM_EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserMessage,
} from "../prompts/crmExtraction";
import type { RawAiRecord } from "../utils/validateRecord";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

function getModel(): string {
  return process.env.OPENAI_MODEL || "openai/gpt-oss-120b";
}

function parseAiResponse(content: string): RawAiRecord[] {
  const parsed = JSON.parse(content) as { records?: RawAiRecord[] };

  if (!parsed.records || !Array.isArray(parsed.records)) {
    throw new Error("AI response missing records array");
  }

  return parsed.records;
}

async function callOpenAI(
  rows: Record<string, string>[],
  startIndex: number
): Promise<RawAiRecord[]> {
  const response = await openai.chat.completions.create({
    model: getModel(),
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CRM_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildExtractionUserMessage(rows, startIndex),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from AI model");
  }

  return parseAiResponse(content);
}

export async function extractBatch(
  rows: Record<string, string>[],
  startIndex: number
): Promise<RawAiRecord[]> {
  try {
    return await callOpenAI(rows, startIndex);
  } catch (firstError) {
    try {
      return await callOpenAI(rows, startIndex);
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("AI extraction failed");
    }
  }
}
