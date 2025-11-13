"use client";

import Alert, { AlertProps } from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { FileList, FileUploadButton, RemoveButton } from "@components/DonationComponents";
import styled from "@mui/material/styles/styled";
import Typography from "@mui/material/Typography";
import React, { ChangeEvent, useState } from "react";

import { CONFIG } from "@/config";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { anonymizeData } from "@/services/anonymization";
import AnonymizationPreview from "@components/AnonymizationPreview";
import DateRangePicker from "@components/DateRangePicker";
import LoadingSpinner from "@components/LoadingSpinner";
import { AnonymizationResult, Conversation, DataSourceValue } from "@models/processed";
import { DonationErrors, getErrorMessage } from "@services/errors";
import { calculateMinMaxDates, filterDataByRange, NullableRange, validateDateRange } from "@services/rangeFiltering";
import { validateMinChatsForDonation, validateMinImportantChatsForDonation } from "@services/validation";

const UploadAlert = styled((props: AlertProps) => <Alert severity="error" {...props} />)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: "100%"
}));

interface MultiFileSelectProps {
  dataSourceValue: DataSourceValue;
  onDonatedConversationsChange: (newDonatedConversations: Conversation[]) => void;
  onFeedbackChatsChange: (newFeedbackChats: Set<string>) => void;
}

const MultiFileSelect: React.FC<MultiFileSelectProps> = ({ dataSourceValue, onDonatedConversationsChange, onFeedbackChatsChange }) => {
  const donation = useRichTranslations("donation");
  const acceptedFileTypes = dataSourceValue == DataSourceValue.WhatsApp ? ".txt, .zip" : dataSourceValue == DataSourceValue.IMessage ? ".db" : ".zip";

  // States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState<number>(0); // Add a key state for file input
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [anonymizationResult, setAnonymizationResult] = useState<AnonymizationResult | null>(null);
  const [calculatedRange, setCalculatedRange] = useState<NullableRange>([null, null]);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  // Handle file selection
  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setDateRangeError(null);

    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
    if (files.length === 0) return;

    setIsLoading(true);
    try {
      const result = await anonymizeData(dataSourceValue, files);
      const { minDate, maxDate } = calculateMinMaxDates(result.anonymizedConversations);

      setAnonymizationResult(result);
      setCalculatedRange([minDate, maxDate]);
      setFilteredConversations(result.anonymizedConversations);
      onDonatedConversationsChange(result.anonymizedConversations); // Update data for parent
    } catch (err) {
      const errorMessage = getErrorMessage(donation.t, err as Error, CONFIG);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clearing files
  const handleClearFiles = () => {
    setError(null);
    setDateRangeError(null);
    setSelectedFiles([]);
    setAnonymizationResult(null);
    setFilteredConversations([]);
    onDonatedConversationsChange([]);
    setFileInputKey(prevKey => prevKey + 1); // Update the key to reset the file input
  };

  // Handle date range selection
  const handleDateRangeChange = (newRange: NullableRange) => {
    // Validate the selected range
    const errorReason = validateDateRange(anonymizationResult?.anonymizedConversations!, newRange);
    setDateRangeError(errorReason);

    if (!errorReason && !error && anonymizationResult) {
      const filteredConversations = filterDataByRange(anonymizationResult.anonymizedConversations, newRange);

      // Validation
      if (!validateMinChatsForDonation(filteredConversations)) {
        setDateRangeError(DonationErrors.TooFewChats);
        return;
      }
      if (!validateMinImportantChatsForDonation(filteredConversations)) {
        setDateRangeError(DonationErrors.TooFewContactsOrMessages);
        return;
      }
      setDateRangeError(null);
      setFilteredConversations(filteredConversations);
      onDonatedConversationsChange(filteredConversations); // Update parent with filtered data
    }
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: "bold" }}>{donation.t("selectData.instruction")}</Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <FileUploadButton
          key={fileInputKey} // Add the key prop here
          onChange={handleFileSelection}
          loading={isLoading}
          accept={acceptedFileTypes}
        />
        <RemoveButton onClick={handleClearFiles} loading={isLoading} />
      </Box>

      {/* Show selected files for feedback */}
      {selectedFiles.length > 0 && (
        <Box sx={{ my: 3, width: "100%" }}>
          <FileList files={selectedFiles} />
          {error && <UploadAlert>{error}</UploadAlert>}
        </Box>
      )}

      {/* Loading indicator */}
      {isLoading && <LoadingSpinner message={donation.t("anonymisation.processing")} />}

      {/* Display anonymized data */}
      {!error && !isLoading && anonymizationResult && filteredConversations && (
        <Box sx={{ my: 3 }}>
          {dataSourceValue !== DataSourceValue.Facebook && dataSourceValue !== DataSourceValue.Instagram && (
            <>
              <DateRangePicker calculatedRange={calculatedRange} setSelectedRange={handleDateRangeChange} />
              {dateRangeError && <UploadAlert>{getErrorMessage(donation.t, dateRangeError, CONFIG)}</UploadAlert>}
            </>
          )}
          <AnonymizationPreview dataSourceValue={dataSourceValue} anonymizedConversations={filteredConversations} chatMappingToShow={anonymizationResult.chatMappingToShow} onFeedbackChatsChange={onFeedbackChatsChange} />
        </Box>
      )}
    </Box>
  );
};

export default MultiFileSelect;
