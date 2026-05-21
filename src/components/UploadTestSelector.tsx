"use client";

import Alert, { AlertProps } from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import styled from "@mui/material/styles/styled";
import { useTranslations } from "next-intl";
import React, { ChangeEvent, useState } from "react";

import { CONFIG } from "@/config";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { anonymizeData } from "@/services/anonymization";
import { getErrorMessage } from "@/services/errors";
import { useAliasConfig } from "@/services/parsing/shared/aliasConfig";
import { DonationRequirementChecks, getDonationRequirementChecks } from "@/services/validation";

import { FileList, FileUploadButton, RemoveButton } from "@components/DonationComponents";
import { DataSourceValue } from "@models/processed";

const UploadAlert = styled((props: AlertProps) => <Alert severity="error" {...props} />)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: "100%"
}));

interface UploadTestSelectorProps {
  dataSourceValue: DataSourceValue;
  onValidationChange?: (isValid: boolean) => void;
}

const UploadTestSelector: React.FC<UploadTestSelectorProps> = ({ dataSourceValue, onValidationChange }) => {
  useAliasConfig();
  const donation = useRichTranslations("donation");
  const testUpload = useRichTranslations("testUpload");
  const links = useTranslations("links");
  const urls = useTranslations("urls");

  const acceptedFileTypes =
    dataSourceValue == DataSourceValue.WhatsApp ? ".txt, .zip" : dataSourceValue == DataSourceValue.IMessage ? ".db" : ".zip";

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [requirementChecks, setRequirementChecks] = useState<DonationRequirementChecks | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const allRequirementsMet = requirementChecks ? Object.values(requirementChecks).every(Boolean) : false;
  const hasRequirementFailures = requirementChecks ? Object.values(requirementChecks).some(status => !status) : false;

  const getRequirementIcon = (status: boolean | undefined) => {
    if (status === undefined) {
      return "•";
    }

    return status ? "✅" : "❌";
  };

  const createErrorReportText = () => {
    const requirementSummary = [
      `minChats=${requirementChecks?.minChats ?? false}`,
      `minImportantChats=${requirementChecks?.minImportantChats ?? false}`,
      `minTimePeriod=${requirementChecks?.minTimePeriod ?? false}`
    ].join(", ");

    return [
      `Data source: ${dataSourceValue}`,
      `Selected files: ${selectedFiles.map(file => file.name).join(", ") || "none"}`,
      `Requirements: ${requirementSummary}`,
      `Error: ${error || "Requirement constraints not met"}`
    ].join("\n");
  };

  const updateValidity = (valid: boolean) => {
    setIsValid(valid);
    onValidationChange?.(valid);
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setCopyStatus(null);
    setRequirementChecks(null);
    updateValidity(false);

    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
    if (files.length === 0) return;

    setIsLoading(true);

    try {
      const result = await anonymizeData(dataSourceValue, files, { skipValidation: true });
      const checks = getDonationRequirementChecks(result.anonymizedConversations);
      setRequirementChecks(checks);

      if (Object.values(checks).every(Boolean)) {
        updateValidity(true);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(donation.t, err as Error, CONFIG);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFiles = () => {
    setError(null);
    setCopyStatus(null);
    setRequirementChecks(null);
    updateValidity(false);
    setSelectedFiles([]);
    setFileInputKey(prevKey => prevKey + 1);
  };

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(createErrorReportText());
      setCopyStatus(testUpload.t("copy.success"));
    } catch {
      setCopyStatus(testUpload.t("copy.fail"));
    }
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: "bold" }}>{donation.t("selectData.instruction")}</Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <FileUploadButton key={fileInputKey} onChange={handleFileSelection} loading={isLoading} accept={acceptedFileTypes} />
        <RemoveButton onClick={handleClearFiles} loading={isLoading} />
      </Box>

      {selectedFiles.length > 0 && (
        <Box sx={{ my: 3, width: "100%" }}>
          <FileList files={selectedFiles} />
          {error && <UploadAlert>{error}</UploadAlert>}
        </Box>
      )}

      {isLoading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {donation.t("anonymisation.processing")}
        </Alert>
      )}

      {selectedFiles.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="subtitle2">{testUpload.t("requirements.title")}</Typography>
          <Typography variant="body2">
            {getRequirementIcon(requirementChecks?.minChats)}{" "}
            {testUpload.t("requirements.minChats", {
              MIN_CHATS_FOR_DONATION: CONFIG.MIN_CHATS_FOR_DONATION
            })}
          </Typography>
          <Typography variant="body2">
            {getRequirementIcon(requirementChecks?.minImportantChats)}{" "}
            {testUpload.t("requirements.minImportantChats", {
              MIN_CHATS_FOR_DONATION: CONFIG.MIN_CHATS_FOR_DONATION,
              MIN_MESSAGES_PER_CHAT: CONFIG.MIN_MESSAGES_PER_CHAT,
              MIN_CONTACTS_PER_CHAT: CONFIG.MIN_CONTACTS_PER_CHAT
            })}
          </Typography>
          <Typography variant="body2">
            {getRequirementIcon(requirementChecks?.minTimePeriod)}{" "}
            {testUpload.t("requirements.minTimePeriod", {
              MIN_DONATION_TIME_PERIOD_MONTHS: CONFIG.MIN_DONATION_TIME_PERIOD_MONTHS
            })}
          </Typography>
        </Stack>
      )}

      {!error && !isLoading && isValid && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {testUpload.t("success")}
        </Alert>
      )}

      {!isLoading && (error || hasRequirementFailures) && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography variant="body2">{testUpload.rich("errorHelp", { link: "reportProblem" })}</Typography>
          <Stack spacing={1} direction={{ xs: "column", sm: "row" }} sx={{ alignItems: "flex-start" }}>
            <Button variant="outlined" onClick={handleCopyError}>
              {testUpload.t("copy.button")}
            </Button>
            <Button variant="contained" component="a" href={urls("reportProblem")} target="_blank" rel="noopener noreferrer">
              {links("reportProblem")}
            </Button>
          </Stack>
          {copyStatus && <Typography variant="caption">{copyStatus}</Typography>}
        </Stack>
      )}
    </Box>
  );
};

export default UploadTestSelector;
