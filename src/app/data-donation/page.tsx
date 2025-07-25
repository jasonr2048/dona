"use client";

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useRichTranslations} from "@/hooks/useRichTranslations";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import {Conversation, DataSourceValue} from "@models/processed";
import {addDonation} from "./actions";
import {useAliasConfig} from "@/services/parsing/shared/aliasConfig";
import MultiFileSelect from "@/components/MultiFileSelect";
import {useDonation} from "@/context/DonationContext";
import {useTranslations} from "next-intl";
import {MainTitle, RichText} from "@/styles/StyledTypography";
import {getErrorMessage} from "@services/errors";
import {FacebookIcon, IMessageIcon, InstagramIcon, WhatsAppIcon} from "@components/CustomIcon";

type ConversationsBySource = Record<DataSourceValue, Conversation[]>;
type SelectedChatsBySource = Record<DataSourceValue, Set<string>>;

export default function DataDonationPage() {
    const router = useRouter();
    const actions = useTranslations("actions");
    const donation = useRichTranslations("donation");
    const donorStrings = useRichTranslations("donor-id");
    const aliasConfig = useAliasConfig();
    const { setDonationData, loadExternalDonorIdFromCookie, externalDonorId } = useDonation();
    const [allDonatedConversationsBySource, setAllDonatedConversationsBySource] = useState<ConversationsBySource>({} as ConversationsBySource);
    const [feedbackChatsBySource, setFeedbackChatsBySource] = useState<SelectedChatsBySource>({} as SelectedChatsBySource);
    const [loading, setLoading] = useState(false);
    const [validated, setValidated] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!externalDonorId) {
            loadExternalDonorIdFromCookie();
        }
    }, [externalDonorId]);

    const handleDonatedConversationsChange = (dataSource: DataSourceValue, newConversations: Conversation[]) => {
        setAllDonatedConversationsBySource((prev) => ({
            ...prev,
            [dataSource]: newConversations,
        }));
        setValidated(true);
    };

    const handleFeedbackChatsChange = (dataSource: DataSourceValue, newFeedbackChats: Set<string>) => {
        setFeedbackChatsBySource((prev) => ({
            ...prev,
            [dataSource]: newFeedbackChats,
        }));
    };

    const onDataDonationUpload = async () => {
        document.body.scrollTo(0, 0);
        setLoading(true);
        setErrorMessage(null);

        const allConversations = Object.entries(allDonatedConversationsBySource).flatMap(([dataSource, conversations]) => {
            const feedbackChats = feedbackChatsBySource[dataSource as DataSourceValue] || new Set();
            return conversations
                .map(conversation => ({
                    ...conversation,
                    focusInFeedback: feedbackChats.has(conversation.conversationPseudonym)
                }));
        });

        if (allConversations.length > 0) {
            try {
                const result = await addDonation(allConversations, aliasConfig.donorAlias, externalDonorId);
                if (result.success && result.donationId && result.graphDataRecord) {
                    setDonationData(result.donationId, result.graphDataRecord);
                    router.push("/donation-feedback");
                } else {
                    setErrorMessage(getErrorMessage(donation.t, result.error));
                }
            } catch (err) {
                setErrorMessage(getErrorMessage(donation.t, err));
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Container maxWidth="md" sx={{ flexGrow: 1, position: "relative" }}>
            {/* Full-page overlay to freeze the page */}
            {loading && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        zIndex: 9999,
                        pointerEvents: "none", // Prevent interactions
                    }}
                />
            )}

            <Stack
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                }}
            >
                <MainTitle variant="h4">{donation.t("select-data.title")}</MainTitle>

                <RichText>{donorStrings.t("your-id")}: {externalDonorId}</RichText>

                {/* Loading spinner and alert  */}
                {loading && (
                    <Stack spacing={2} sx={{ zIndex: 10000, alignItems: "center" }}>
                        <CircularProgress color="inherit" />
                        <Alert severity="info">{donation.t("sending-wait")}</Alert>
                    </Stack>
                )}

                {errorMessage && !loading && <Alert severity="error">{errorMessage}</Alert>}

                {!errorMessage && !loading && (
                    <Box>
                        <RichText>{donation.t("select-data.body1")}</RichText>
                        <RichText>{donation.rich("select-data.body2")}</RichText>
                    </Box>
                )}
                <Box sx={{ my: 4, minWidth: "80%", textAlign: "left" }}>
                    {[DataSourceValue.WhatsApp, DataSourceValue.Facebook, DataSourceValue.Instagram, DataSourceValue.IMessage].map((source) => (
                        <Accordion key={source} sx={{ my: 1 }}>
                            <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                                {source === DataSourceValue.WhatsApp && <WhatsAppIcon sx={{ mr: 1, mt: 0.5 }} />}
                                {source === DataSourceValue.Facebook && <FacebookIcon sx={{ mr: 1, mt: 0.5 }} />}
                                {source === DataSourceValue.Instagram && <InstagramIcon sx={{ mr: 1, mt: 0.5 }} />}
                                {source === DataSourceValue.IMessage && <IMessageIcon sx={{ mr: 1, mt: 0.5 }} />}
                                <Typography variant="h6">
                                    {donation.t("datasource-title_format", { datasource: source == DataSourceValue.IMessage ? "iMessage" : source })}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <MultiFileSelect
                                    dataSourceValue={source}
                                    onDonatedConversationsChange={(newConversations) => handleDonatedConversationsChange(source, newConversations)}
                                    onFeedbackChatsChange={(newFeedbackChats) => handleFeedbackChatsChange(source, newFeedbackChats)}
                                />
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>

                <Box>
                    <Stack spacing={2} direction='row' sx={{justifyContent: 'center'}}>
                        <Button variant='contained' href='/instructions'>
                            {actions('previous')}
                        </Button>
                        <Button variant='contained' onClick={onDataDonationUpload} disabled={loading || !validated}>
                            {actions('submit')}
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Container>
    );
}
