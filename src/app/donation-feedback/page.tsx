"use client";

import React, { useEffect, useState } from "react";
import {useLocale, useTranslations} from "next-intl";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useDonation } from "@/context/DonationContext";
import {fetchGraphDataByDonationId, getDonationId} from "./actions";
import LoadingSpinner from "@components/LoadingSpinner";
import DataSourceFeedbackSection from "@components/DataSourceFeedbackSection";
import {MainTitle, RichText} from "@/styles/StyledTypography";
import {useRichTranslations} from "@/hooks/useRichTranslations";
import Box from "@mui/material/Box";
import {DataSourceValue} from "@models/processed";


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
                        const fetchedGraphData = await fetchGraphDataByDonationId(donationIdFromCookie);
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
        window.location.href = isFeedbackSurveyEnabled && feedbackSurveyLink
            ? `${feedbackSurveyLink}?UID=${externalDonorId}&lang=${locale}`
            : "/";
    };

    return (
        <Container maxWidth="md" sx={{flexGrow: 1}}>
            <Stack
                spacing={3}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                }}
            >
                <MainTitle variant="h5">{feedback.t("title")}</MainTitle>

                {/* Loading indicator */}
                {isLoading && <LoadingSpinner message={feedback.t("loading")}/>}

                {/* Error fetching required data*/}
                {!isLoading && !feedbackData && (
                    <Alert severity="error" sx={{ mt: 2 }}>{feedback.t("genericError")}</Alert>
                )}

                {feedbackData && (
                    <>
                        <Alert severity="info">
                            <Typography variant="body1">{feedback.t("important-message.title")}</Typography>
                            <Typography variant="body2">{feedback.rich("important-message.disclaimer")}</Typography>
                        </Alert>

                        <Box sx={{width: "100%", textAlign: "left"}}>
                            {Object.entries(feedbackData).map(([source, data]) => (
                                <DataSourceFeedbackSection
                                    key={source}
                                    dataSourceValue={source as DataSourceValue}
                                    graphData={data}
                                />
                            ))}
                        </Box>

                        <RichText sx={{py: 2}}>{feedback.t("thanks")}</RichText>
                        <Button variant="contained" onClick={handleContinue}>
                            {actions("next")}
                        </Button>
                    </>
                )}
            </Stack>
        </Container>
    );
}