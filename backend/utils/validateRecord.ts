import type { CrmLead, CrmStatus, DataSource } from "../types/crm";

const CRM_STATUSES = new Set<CrmStatus>([
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
]);

const DATA_SOURCES = new Set<DataSource>([
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
]);

export interface RawAiRecord {
  _rowIndex: number;
  skip?: boolean;
  reason?: string;
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: string;
  crm_note?: string;
  data_source?: string;
  possession_time?: string;
  description?: string;
}

function clean(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function hasEmail(email?: string): boolean {
  const value = clean(email);
  return Boolean(value && value.includes("@"));
}

function hasMobile(mobile?: string): boolean {
  const digits = clean(mobile)?.replace(/\D/g, "");
  return Boolean(digits && digits.length >= 6);
}

function normalizeCountryCode(value?: string): string | undefined {
  const cleaned = clean(value);
  if (!cleaned) return undefined;

  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return undefined;

  return `+${digits}`;
}

function splitPhone(
  mobile?: string,
  existingCountryCode?: string
): { country_code?: string; mobile_without_country_code?: string } {
  const raw = clean(mobile);
  if (!raw) {
    return {
      country_code: normalizeCountryCode(existingCountryCode),
      mobile_without_country_code: undefined,
    };
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return {
      country_code: normalizeCountryCode(existingCountryCode),
      mobile_without_country_code: undefined,
    };
  }

  let countryCode = normalizeCountryCode(existingCountryCode);
  let localDigits = digits;

  if (raw.startsWith("+") || (digits.startsWith("91") && digits.length > 10)) {
    if (digits.startsWith("91") && digits.length >= 12) {
      countryCode = "+91";
      localDigits = digits.slice(2);
    } else if (digits.startsWith("1") && digits.length === 11) {
      countryCode = "+1";
      localDigits = digits.slice(1);
    }
  } else if (!countryCode && digits.length > 10) {
    countryCode = "+91";
    localDigits = digits.slice(-10);
  }

  return {
    country_code: countryCode,
    mobile_without_country_code: localDigits || undefined,
  };
}

function normalizeStatus(value?: string): CrmStatus | undefined {
  const status = clean(value)?.toUpperCase().replace(/\s+/g, "_");
  if (!status) return undefined;
  return CRM_STATUSES.has(status as CrmStatus) ? (status as CrmStatus) : undefined;
}

function normalizeDataSource(value?: string): DataSource | "" {
  const source = clean(value)?.toLowerCase().replace(/\s+/g, "_");
  if (!source) return "";
  return DATA_SOURCES.has(source as DataSource) ? (source as DataSource) : "";
}

function normalizeDate(value?: string): string | undefined {
  const cleaned = clean(value);
  if (!cleaned) return undefined;

  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) return cleaned;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
}

export function validateRecord(
  record: RawAiRecord,
  raw: Record<string, string>
): { lead?: CrmLead; skipped?: { rowIndex: number; raw: Record<string, string>; reason: string } } {
  const rowIndex = record._rowIndex;

  if (record.skip) {
    return {
      skipped: {
        rowIndex,
        raw,
        reason: record.reason || "Skipped by AI",
      },
    };
  }

  const email = clean(record.email);
  const phone = splitPhone(record.mobile_without_country_code, record.country_code);

  if (!hasEmail(email) && !hasMobile(phone.mobile_without_country_code)) {
    return {
      skipped: {
        rowIndex,
        raw,
        reason: "Record has neither email nor mobile number",
      },
    };
  }

  const lead: CrmLead = {
    created_at: normalizeDate(record.created_at),
    name: clean(record.name),
    email: hasEmail(email) ? email : undefined,
    country_code: phone.country_code,
    mobile_without_country_code: phone.mobile_without_country_code,
    company: clean(record.company),
    city: clean(record.city),
    state: clean(record.state),
    country: clean(record.country),
    lead_owner: clean(record.lead_owner),
    crm_status: normalizeStatus(record.crm_status),
    crm_note: clean(record.crm_note),
    data_source: normalizeDataSource(record.data_source),
    possession_time: clean(record.possession_time),
    description: clean(record.description),
  };

  return { lead };
}
