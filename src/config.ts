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

export const CONFIG = {
  MIN_DONATION_TIME_PERIOD_MONTHS: 6,

  MIN_CHATS_FOR_DONATION: 5,
  MIN_MESSAGES_PER_CHAT: 100,
  MIN_CONTACTS_PER_CHAT: 2,

  MAX_FEEDBACK_CHATS: 10,
  MIN_FEEDBACK_CHATS: 3,
  DEFAULT_FEEDBACK_CHATS: 5
};
