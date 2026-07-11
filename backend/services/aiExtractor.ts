import OpenAI from "openai";
import {
  CRM_EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserMessage,
} from "../prompts/crmExtraction";
import type { RawAiRecord } from "../utils/validateRecord";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getModel(): string {
  return process.env.OPENAI_MODEL || "openai/gpt-oss-120b";
}

function parseAiResponse(content: string): RawAiRecord[] {
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/```$/, "").trim();
  }
  const parsed = JSON.parse(cleaned) as { records?: RawAiRecord[] };

  if (!parsed.records || !Array.isArray(parsed.records)) {
    throw new Error("AI response missing records array");
  }

  return parsed.records;
}

async function callOpenAI(
  rows: Record<string, string>[],
  startIndex: number
): Promise<RawAiRecord[]> {
  try {
    const response = await openai.chat.completions.create({
      model: getModel(),
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
  } catch (error: any) {
    console.error("OpenAI/Groq API Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      failed_generation: error.failed_generation || (error.response && error.response.data),
    });
    throw error;
  }
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
