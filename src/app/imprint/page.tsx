"use client";

import { useRichTranslations } from "@/hooks/useRichTranslations";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { MainTitle, RichText, BlockTitle } from "@/styles/StyledTypography";

export default function Imprint() {
  const imprint = useRichTranslations("imprint");

  return (
    <Container>
      <Box className="mobile-padding">
        <MainTitle variant="h4">{imprint.t("title")}</MainTitle>

        <RichText>{imprint.rich("imprint", { link: "uniBielefeld" })}</RichText>

        <BlockTitle variant="h5">{imprint.t("rsa.title")}</BlockTitle>
        <RichText>{imprint.rich("rsa.body")}</RichText>

        <BlockTitle variant="h5">{imprint.t("responsibleDona.title")}</BlockTitle>
        <RichText>
          {imprint.rich("responsibleDona.body", { link: "donaResponsibleHomepage" })}
        </RichText>

        <BlockTitle variant="h5">{imprint.t("responsibleCentralWebsite.title")}</BlockTitle>
        <RichText>{imprint.rich("responsibleCentralWebsite.body")}</RichText>

        <BlockTitle variant="h5">{imprint.t("liabilityDisclaimer.title")}</BlockTitle>
        <RichText>{imprint.rich("liabilityDisclaimer.body")}</RichText>

        <BlockTitle variant="h5">{imprint.t("copyright.title")}</BlockTitle>
        <RichText>{imprint.rich("copyright.body")}</RichText>

        <BlockTitle variant="h5">{imprint.t("photoCredits.title")}</BlockTitle>
        <RichText>{imprint.rich("photoCredits.body")}</RichText>
      </Box>
    </Container>
  );
}
