"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { useDonation } from "@/context/DonationContext";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { MainTitle, RichText } from "@/styles/StyledTypography";
import DataSourceFeedbackSection from "@components/DataSourceFeedbackSection";
import LoadingSpinner from "@components/LoadingSpinner";
import { DataSourceValue } from "@models/processed";

import { fetchOrComputeGraphDataByDonationId, getDonationId } from "./actions";

const isFeedbackSurveyEnabled = process.env.NEXT_PUBLIC_FEEDBACK_SURVEY_ENABLED === "true";
const feedbackSurveyLink = process.env.NEXT_PUBLIC_FEEDBACK_SURVEY_LINK;

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
    window.location.href = isFeedbackSurveyEnabled && feedbackSurveyLink ? `${feedbackSurveyLink}?UID=${externalDonorId}&lang=${locale}` : "/";
  };

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
            <Button variant="contained" onClick={handleContinue}>
              {actions("next")}
            </Button>
          </>
        )}
      </Stack>
    </Container>
  );
}
