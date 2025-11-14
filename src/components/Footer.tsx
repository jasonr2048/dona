"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { FooterButton } from "@/styles/StyledButtons";

export default function Footer() {
  const links = useTranslations("links");
  const urls = useTranslations("urls");
  const projectNumber = useTranslations("footer")("projectNumber");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Detects mobile screens

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto", // Ensures the footer is pushed to the bottom
        pt: 2,
        pb: 0.5,
        backgroundColor: theme.palette.background.default,
        textAlign: "center"
      }}
    >
      <Container>
        <Stack direction={isMobile ? "column" : "row"} spacing={0} justifyContent="space-between" alignItems="center">
          {/* Left: Buttons */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
            <FooterButton variant="text" size={isMobile ? "small" : "medium"} href="/data-protection">
              {links("dataProtection")}
            </FooterButton>
            <FooterButton variant="text" size={isMobile ? "small" : "medium"} href="/imprint">
              {links("imprint")}
            </FooterButton>
          </Stack>

          {/* Right: Icons + Project Number (below icons) */}
          <Stack direction="column" alignItems="center" sx={{ mt: isMobile ? 2 : 0 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap", justifyContent: "center" }}>
              <Link href="https://www.bmbf.de/" target="_blank">
                <Image src="images/logos/BMBF_logo.svg" alt="Bundesministerium für Bildung und Forschung (BMBF) logo" width={90} height={50} />
              </Link>
              <Link href="https://www.hpi.de" target="_blank">
                <Image src="images/logos/HPI_logo.svg" alt="Hasso Plattner Institut (HPI) logo" width={90} height={50} />
              </Link>
              <Link href="https://www.data4life.care/" target="_blank">
                <Image src="images/logos/data4life-blueLogo.svg" alt="Data 4 Life logo" width={80} height={50} />
              </Link>
            </Stack>
            <Typography variant="caption" sx={{ textAlign: "center", mt: 0, pt: 0, mb: 0 }}>
              {projectNumber}
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
