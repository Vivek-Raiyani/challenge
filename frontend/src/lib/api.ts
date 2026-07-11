import axios from "axios";
import type { ImportResponse } from "../types/crm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const isDev = process.env.NODE_ENV === "development";

function devLog(message: string, data?: unknown) {
  if (isDev) {
    if (data !== undefined) {
      console.log(`[frontend] ${message}`, data);
    } else {
      console.log(`[frontend] ${message}`);
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Import failed";
  }

  if (error.code === "ECONNABORTED") {
    return "Import timed out. Try a smaller file or retry in a moment.";
  }

  if (!error.response) {
    return "Network error. Make sure the backend server is running and reachable.";
  }

  const serverMessage = (error.response.data as { error?: string } | undefined)
    ?.error;

  if (serverMessage) {
    return serverMessage;
  }

  if (error.response.status >= 500) {
    return "Server error during import. Please retry.";
  }

  return error.message || "Import failed";
}

export async function importCsv(file: File): Promise<ImportResponse> {
  const form = new FormData();
  form.append("file", file);

  devLog(`POST ${API_URL}/api/import`, { file: file.name, size: file.size });

  try {
    const response = await axios.post<ImportResponse>(
      `${API_URL}/api/import`,
      form,
      {
        timeout: 120000,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    devLog("import response", response.data.stats);
    return response.data;
  } catch (error) {
    devLog("import failed", error instanceof Error ? error.message : error);
    throw new Error(getErrorMessage(error));
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    devLog(`GET ${API_URL}/health`);
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    devLog("health check", response.data);
    return response.data?.status === "ok";
  } catch {
    return false;
  }
}
