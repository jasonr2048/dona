import { DataSourceValue } from "@/models/processed";
import { parse } from "path";

const SUPPORTED_LOCALES = ["en", "de", "hy"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  hy: "Armenian"
};

const parseEnabledLocales = (rawValue: string | undefined): Locale[] => {
  if (!rawValue) {
    return [...SUPPORTED_LOCALES];
  }

  const parsed = rawValue
    .split(",")
    .map(locale => locale.trim())
    .filter((locale): locale is Locale => SUPPORTED_LOCALES.includes(locale as Locale));

  // Ensure at least one language is available, even with malformed env input.
  return parsed.length > 0 ? parsed : [...SUPPORTED_LOCALES];
};

const parseDefaultLocale = (rawValue: string | undefined, enabledLocales: Locale[]): Locale => {
  if (rawValue && enabledLocales.includes(rawValue as Locale)) {
    return rawValue as Locale;
  }

  return enabledLocales[0] ?? "en";
};

export const locales = parseEnabledLocales(process.env.NEXT_PUBLIC_ENABLED_LANGUAGES);
export const defaultLocale = parseDefaultLocale(process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE, locales);

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
};

const parseNumberEnv = (value: string | undefined, defaultValue: number): number => {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};
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

  MIN_CHATS_FOR_DONATION: parseNumberEnv(process.env.NEXT_PUBLIC_MIN_CHATS_FOR_DONATION, 5),
  MIN_MESSAGES_PER_CHAT: parseNumberEnv(process.env.NEXT_PUBLIC_MIN_MESSAGES_PER_CHAT, 3),
  MIN_CONTACTS_PER_CHAT: parseNumberEnv(process.env.NEXT_PUBLIC_MIN_CONTACTS_PER_CHAT, 2),

  DUPLICATE_DONATION_CHECK_ENABLED: parseBooleanEnv(process.env.NEXT_PUBLIC_DUPLICATE_DONATION_CHECK_ENABLED, true),
  MIN_MESSAGES_FOR_DUPLICATE_CHECK: parseNumberEnv(process.env.NEXT_PUBLIC_MIN_MESSAGES_FOR_DUPLICATE_CHECK, 100),
  PUBLIC_DATA_DONATION_ENABLED: parseBooleanEnv(process.env.NEXT_PUBLIC_PUBLIC_DATA_DONATION_ENABLED, false),

  MAX_FEEDBACK_CHATS: parseNumberEnv(process.env.NEXT_PUBLIC_MAX_FEEDBACK_CHATS, 10),
  MIN_FEEDBACK_CHATS: parseNumberEnv(process.env.NEXT_PUBLIC_MIN_FEEDBACK_CHATS, 3),
  DEFAULT_FEEDBACK_CHATS: parseNumberEnv(process.env.NEXT_PUBLIC_DEFAULT_FEEDBACK_CHATS, 5)
};
