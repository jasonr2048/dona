export type Locale = (typeof locales)[number];

export const locales = ["en", "de", "hy"] as const;
export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  hy: "Armenian"
};
export const defaultLocale: Locale = "en";

export const CONFIG = {
  MIN_DONATION_TIME_PERIOD_MONTHS: 6,

  MIN_CHATS_FOR_DONATION: 5,
  MIN_MESSAGES_PER_CHAT: 100,
  MIN_CONTACTS_PER_CHAT: 2,

  MAX_FEEDBACK_CHATS: 10,
  MIN_FEEDBACK_CHATS: 3,
  DEFAULT_FEEDBACK_CHATS: 5
};
