"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useDonation } from "@/context/DonationContext";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { MainTitle, RichText } from "@/styles/StyledTypography";
import DataSourceFeedbackSection from "@components/DataSourceFeedbackSection";
import LoadingSpinner from "@components/LoadingSpinner";
import { DataSourceValue } from "@models/processed";

import { fetchOrComputeGraphDataByDonationId, getDonationId } from "./actions";

const isFeedbackSurveyEnabled = process.env.NEXT_PUBLIC_FEEDBACK_SURVEY_ENABLED === "true";
const feedbackSurveyLink = process.env.NEXT_PUBLIC_FEEDBACK_SURVEY_LINK;
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const sampleDataFiles = [
  {
    key: "whatsapp",
    href: "/documents/sample-data/whatsapp_artificial_export.zip"
  },
  {
    key: "instagram",
    href: "/documents/sample-data/artificial_instagram_export_valid.zip"
  },
  {
    key: "imessage",
    href: "/documents/sample-data/valid_data.db"
  }
] as const;

export default function DonationFeedbackPage() {
  const actions = useTranslations("actions");
  const feedback = useRichTranslations("feedback");
  const { externalDonorId, feedbackData, setDonationData } = useDonation();
  const [isLoading, setIsLoading] = useState(!feedbackData);
  const locale = useLocale();

  useEffect(() => {
    const loadGraphData = async () => {
      if (!feedbackData) {
        try {
          const donationIdFromCookie = await getDonationId();
          if (donationIdFromCookie) {
            const fetchedGraphData = await fetchOrComputeGraphDataByDonationId(donationIdFromCookie);
            setDonationData(donationIdFromCookie, fetchedGraphData);
          }
        } catch (error) {
          console.error("Error fetching graph data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadGraphData();
  }, [feedbackData, setDonationData]);

  const handleContinue = () => {
    window.location.href =
      isFeedbackSurveyEnabled && feedbackSurveyLink
        ? `${feedbackSurveyLink}?UID=${externalDonorId}&lang=${locale}`
        : "/";
  };

  const sampleDataDownloads = (
    <Box
      sx={{
        width: "100%",
        border: "2px solid",
        borderColor: "primary.main",
        borderRadius: 2,
        p: 2,
        textAlign: "left"
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        {feedback.t("sampleData.title")}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {feedback.t("sampleData.body")}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {sampleDataFiles.map(file => (
          <Button key={file.key} variant="outlined" component="a" href={file.href} download>
            {feedback.t(`sampleData.${file.key}`)}
          </Button>
        ))}
      </Stack>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1 }}>
      <Stack
        spacing={3}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}
      >
        <MainTitle variant="h5">{feedback.t("title")}</MainTitle>

        {isDemoMode && (
          <Alert severity="warning" sx={{ width: "100%" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {feedback.t("demoMode.title")}
            </Typography>
            <Typography variant="body2">{feedback.t("demoMode.body")}</Typography>
          </Alert>
        )}

        {isDemoMode && sampleDataDownloads}

        {/* Loading indicator */}
        {isLoading && <LoadingSpinner message={feedback.t("loading")} />}

        {/* Error fetching required data*/}
        {!isLoading && !feedbackData && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {feedback.t("genericError")}
          </Alert>
        )}

        {feedbackData && (
          <>
            <Alert severity="info">
              <Typography variant="body1">{feedback.t("importantMessage.title")}</Typography>
              <Typography variant="body2">{feedback.rich("importantMessage.disclaimer")}</Typography>
            </Alert>

            <Box sx={{ width: "100%", textAlign: "left" }}>
              {Object.entries(feedbackData).map(([source, data]) => (
                <DataSourceFeedbackSection key={source} dataSourceValue={source as DataSourceValue} graphData={data} />
              ))}
            </Box>

            <RichText sx={{ py: 2 }}>{feedback.t("thanks")}</RichText>
            {!isDemoMode && (
              <Button variant="contained" onClick={handleContinue}>
                {actions("next")}
              </Button>
            )}

            {isDemoMode && sampleDataDownloads}
          </>
        )}
      </Stack>
    </Container>
  );
}
