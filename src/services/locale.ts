"use server";

import { cookies } from "next/headers";

import { defaultLocale, Locale, locales } from "@/config";

const COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale() {
  const cookieLocale = (await cookies()).get(COOKIE_NAME)?.value;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  return defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  const safeLocale = locales.includes(locale) ? locale : defaultLocale;
  (await cookies()).set(COOKIE_NAME, safeLocale);
}
