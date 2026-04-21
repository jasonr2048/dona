import { DataSourceValue } from "@/models/processed";

export type Locale = (typeof locales)[number];

export const locales = ["en", "de", "hy"] as const;
export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  hy: "Armenian"
};
export const defaultLocale: Locale = "en";

const DATA_SOURCE_ALIASES: Record<string, DataSourceValue> = {
  whatsapp: DataSourceValue.WhatsApp,
  wa: DataSourceValue.WhatsApp,
  facebook: DataSourceValue.Facebook,
  fb: DataSourceValue.Facebook,
  instagram: DataSourceValue.Instagram,
  ig: DataSourceValue.Instagram,
  imessage: DataSourceValue.IMessage,
  imsg: DataSourceValue.IMessage
};

export const DEFAULT_ENABLED_DATA_SOURCES: DataSourceValue[] = [
  DataSourceValue.WhatsApp,
  DataSourceValue.Facebook,
  DataSourceValue.Instagram,
  DataSourceValue.IMessage
];

export function parseEnabledDataSources(rawValue: string | undefined): DataSourceValue[] {
  if (!rawValue || rawValue.trim() === "") {
    return DEFAULT_ENABLED_DATA_SOURCES;
  }

  const parsed = rawValue
    .split(",")
    .map(value => value.trim().toLowerCase())
    .map(value => DATA_SOURCE_ALIASES[value])
    .filter((value): value is DataSourceValue => Boolean(value));

  // If the env value is invalid, keep app functional with all sources enabled.
  if (parsed.length === 0) {
    return DEFAULT_ENABLED_DATA_SOURCES;
  }

  return Array.from(new Set(parsed));
}

export const ENABLED_DATA_SOURCES = parseEnabledDataSources(process.env.NEXT_PUBLIC_ENABLED_DATA_SOURCES);

export const CONFIG = {
  MIN_DONATION_TIME_PERIOD_MONTHS: 6,

  MIN_CHATS_FOR_DONATION: 5,
  MIN_MESSAGES_PER_CHAT: 100,
  MIN_CONTACTS_PER_CHAT: 2,

  MAX_FEEDBACK_CHATS: 10,
  MIN_FEEDBACK_CHATS: 3,
  DEFAULT_FEEDBACK_CHATS: 5
};
