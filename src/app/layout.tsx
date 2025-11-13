import CssBaseline from "@mui/material/CssBaseline";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import React from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "@/styles/globals.css";
import { Locale } from "@/config";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { DonationProvider } from "@/context/DonationContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dona",
  description: "Social Gathering Platform"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await getLocale()) as Locale;
  const messages = (await getMessages()) as Record<string, any>;
  const uniBielefeldUrl = messages?.urls?.["uniBielefeld"];

  return (
    <html lang={locale}>
      <body className={inter.className} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <NextIntlClientProvider messages={messages}>
          <DonationProvider>
            <CssBaseline />
            <Header locale={locale} />

            {/* Universität Bielefeld Button */}
            <Box sx={{ display: "flex", justifyContent: "flex-start", pl: 2, mt: 1 }}>
              <Button
                component={Link}
                href={uniBielefeldUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  backgroundColor: "transparent",
                  padding: 0,
                  "&:hover": { backgroundColor: "transparent" }
                }}
              >
                <Image src="/images/logos/uni-bielefeld-logo.svg" alt="Universität Bielefeld" width={150} height={75} />
              </Button>
            </Box>

            <Box sx={{ flex: "1 0 auto" }}>{children}</Box>

            <Footer />
          </DonationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
