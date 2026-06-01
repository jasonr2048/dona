"use server";

import { cookies, headers } from "next/headers";

import { defaultLocale, Locale, locales } from "@/config";

const COOKIE_NAME = "NEXT_LOCALE";
const isBrowserLanguageEnabled = process.env.BROWSER_LANGUAGE_ENABLED === "true";

const parseAcceptLanguage = (acceptLanguage: string): Locale | null => {
  const candidates = acceptLanguage
    .split(",")
    .map(value => value.trim().split(";")[0])
    .filter(Boolean);

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    const base = normalized.split("-")[0] || normalized;
    if (locales.includes(base as Locale)) {
      return base as Locale;
    }
  }

  return null;
};

export async function getUserLocale() {
  const cookieLocale = (await cookies()).get(COOKIE_NAME)?.value;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  if (isBrowserLanguageEnabled) {
    const acceptLanguage = (await headers()).get("accept-language");
    if (acceptLanguage) {
      const browserLocale = parseAcceptLanguage(acceptLanguage);
      if (browserLocale) {
        return browserLocale;
      }
    }
  }

  return defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  const safeLocale = locales.includes(locale) ? locale : defaultLocale;
  (await cookies()).set(COOKIE_NAME, safeLocale);
}
