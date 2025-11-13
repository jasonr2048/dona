"use client";

import { useRichTranslations } from "@/hooks/useRichTranslations";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { BlockTitle, ContactBlock, MainTitle } from "@/styles/StyledTypography";
import Typography from "@mui/material/Typography";

export default function DataProtection() {
  const protection = useRichTranslations("dataProtection");
  const storage = useRichTranslations("data-storage");
  const consent = useRichTranslations("consent");

  return (
    <Container>
      <Box className="mobile-padding">
        <MainTitle variant="h4">{protection.t("title")}</MainTitle>

        <MainTitle variant="h5">{protection.t("technicalDetails.title")}</MainTitle>
        <Typography gutterBottom>{protection.rich("technicalDetails.body1")}</Typography>
        <Typography gutterBottom>{protection.rich("technicalDetails.body2")}</Typography>
        <Typography gutterBottom>{protection.rich("technicalDetails.body3")}</Typography>
        <Typography gutterBottom>{protection.rich("technicalDetails.body4")}</Typography>

        <MainTitle variant="h5">{protection.t("participation.title")}</MainTitle>

        <BlockTitle variant="h5">{storage.t("title")}</BlockTitle>
        <Typography gutterBottom>{storage.rich("body1")}</Typography>
        <Typography gutterBottom>{storage.rich("body2", { link: "limesurvey" })}</Typography>

        <BlockTitle variant="h5">{consent.t("voluntary.title")}</BlockTitle>
        <Typography gutterBottom>{consent.rich("voluntary.body")}</Typography>

        <BlockTitle variant="h5">{consent.t("dataProtection.title")}</BlockTitle>
        <Typography gutterBottom>{consent.rich("dataProtection.body")}</Typography>
        <ContactBlock>{consent.rich("dataProtection.contact")}</ContactBlock>

        <BlockTitle variant="h5">{protection.t("participation.usage.title")}</BlockTitle>
        <Typography gutterBottom>{protection.rich("participation.usage.body")}</Typography>
      </Box>
    </Container>
  );
}
