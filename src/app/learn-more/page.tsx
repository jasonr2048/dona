"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Image from "next/image";

import { useRichTranslations } from "@/hooks/useRichTranslations";
import { MainTitle, RichText } from "@/styles/StyledTypography";

export default function LearnMore() {
  const actions = useRichTranslations("actions");
  const learnMore = useRichTranslations("learnMore");

  return (
    <Container maxWidth="md">
      <Box textAlign="center" className="mobile-padding">
        {/* Data Used Section */}
        <MainTitle variant="h4">{learnMore.t("dataUsed.title")}</MainTitle>
        <RichText>{learnMore.rich("dataUsed.body1")}</RichText>
        <RichText>{learnMore.rich("dataUsed.body2", { link: "limesurveyDataUse" })}</RichText>

        {/* Images with Captions */}
        <Grid container spacing={3} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
          {["textMessages", "voiceMessages"].map(imgKey => (
            <Grid key={imgKey} size={{ xs: 12 }} textAlign="center">
              <Box
                component="figure"
                sx={{
                  boxShadow: 2,
                  borderRadius: 2,
                  p: 1,
                  backgroundColor: "background.paper",
                  maxWidth: { xs: "100%", md: "75%" }, // Makes the image bigger
                  mx: "auto"
                }}
              >
                <Image src={learnMore.t(`images.${imgKey}.imagePath`)} alt={learnMore.t(`images.${imgKey}.caption`)} width={0} height={0} style={{ width: "100%", height: "auto" }} loading="lazy" />
                <figcaption>
                  <RichText sx={{ fontStyle: "italic" }}>{learnMore.t(`images.${imgKey}.caption`)}</RichText>
                </figcaption>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Data Handling Section */}
        <MainTitle variant="h4" sx={{ mt: 4 }}>
          {learnMore.t("dataHandling.title")}
        </MainTitle>
        <RichText>{learnMore.rich("dataHandling.body1")}</RichText>
        <RichText>{learnMore.rich("dataHandling.body2")}</RichText>

        {/* Navigation Buttons */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={2} justifyContent="center">
            <Grid size="auto">
              <Button variant="contained" href="/">
                {actions.t("previous")}
              </Button>
            </Grid>
            <Grid size="auto">
              <Button variant="contained" href="/instructions">
                {actions.t("start")}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}
