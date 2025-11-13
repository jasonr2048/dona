"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useLocale } from "next-intl";
import React, { useEffect, useState } from "react";

import { checkDonorIdExists } from "@/app/instructions/actions";
import { generateExternalDonorId, useDonation } from "@/context/DonationContext";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { BlockTitle, ContactBlock } from "@/styles/StyledTypography";
import FullSizeModal from "@components/FullSizeModal";
import { IdInputMethod } from "@models/settings";

const idInputMethod = process.env.NEXT_PUBLIC_DONOR_ID_INPUT_METHOD as IdInputMethod;
const isDonorSurveyEnabled = process.env.NEXT_PUBLIC_DONOR_SURVEY_ENABLED === "true";
const donorSurveyLink = process.env.NEXT_PUBLIC_DONOR_SURVEY_LINK;

export default function ConsentModal() {
  const actions = useRichTranslations("actions");
  const consent = useRichTranslations("consent");
  const storage = useRichTranslations("dataStorage");
  const donor = useRichTranslations("donorId");
  const errors = useRichTranslations("donation.errors");
  const { externalDonorId, setExternalDonorId } = useDonation();
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [generatedId, setGeneratedId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  useEffect(() => {
    if (idInputMethod === IdInputMethod.AUTOMATED || idInputMethod === IdInputMethod.SHOW_ID) {
      const newId = generateExternalDonorId();
      setGeneratedId(newId);
      setExternalDonorId(newId);
    }
  }, []);

  const validateDonorId = async (id: string) => {
    if (!id.trim()) {
      return;
    }

    setIsValidating(true);
    setIdError(null);

    try {
      const exists = await checkDonorIdExists(id);
      if (exists) {
        setIdError(errors.t("DuplicateDonorId"));
      }
    } catch (error) {
      console.error("Error validating donor ID:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setManualId(newId);

    // Debounce validation to avoid too many requests
    const timeoutId = setTimeout(() => {
      validateDonorId(newId);
    }, 500);

    return () => clearTimeout(timeoutId);
  };
  const handleAgree = () => {
    if (idInputMethod === IdInputMethod.MANUALLY && manualId.trim()) {
      if (idError) {
        return; // Don't proceed if there's an error
      }
      setExternalDonorId(manualId);
    }

    window.location.href = isDonorSurveyEnabled && donorSurveyLink ? `${donorSurveyLink}?UID=${externalDonorId}&lang=${locale}` : "/data-donation";
  };
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleDialogClose = () => setDialogOpen(false);

  return (
    <div>
      <Button variant="contained" onClick={handleOpen}>
        {actions.t("donate")}
      </Button>
      <FullSizeModal open={open} onClose={handleClose} onAgree={idInputMethod === IdInputMethod.AUTOMATED ? handleAgree : () => setDialogOpen(true)} ariaLabel="Consent Modal">
        <Box sx={{ display: "flex" }}>
          <Typography variant="h4" sx={{ my: 4, flexGrow: 1 }} id="modal-modal-title">
            {consent.t("title")}
          </Typography>
          <Box sx={{ alignSelf: "center" }}>
            <Button variant="contained" target="_blank" href={consent.t("pdf.file")} size="small">
              {consent.t("pdf.button")}
            </Button>
          </Box>
        </Box>

        <BlockTitle>{consent.t("about.title")}</BlockTitle>
        <Typography>{consent.t("about.body1")}</Typography>
        <Typography sx={{ mt: 1 }}>{consent.t("about.body2")}</Typography>

        <BlockTitle>{consent.t("benefit.title")}</BlockTitle>
        <Typography>{consent.rich("benefit.body", { link: "cadoozBenefit" })}</Typography>

        <BlockTitle>{storage.t("title")}</BlockTitle>
        <Typography>{storage.rich("body1")}</Typography>
        <Typography sx={{ mt: 1 }}>{storage.rich("body2", { link: "limesurvey" })}</Typography>

        <BlockTitle>{consent.t("voluntary.title")}</BlockTitle>
        <Typography>{consent.t("voluntary.body")}</Typography>

        <BlockTitle>{consent.t("dataProtection.title")}</BlockTitle>
        <Typography>{consent.t("dataProtection.body")}</Typography>

        <ContactBlock>{consent.rich("dataProtection.contact")}</ContactBlock>

        <BlockTitle>{consent.t("dataPurpose.title")}</BlockTitle>
        <Typography>{consent.t("dataPurpose.body")}</Typography>

        <Typography variant="body1" sx={{ mt: 4, mb: 2, fontWeight: "bold", textAlign: "center" }}>
          {consent.t("confirmation")}
        </Typography>
      </FullSizeModal>

      {idInputMethod !== IdInputMethod.AUTOMATED && (
        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle>{idInputMethod === IdInputMethod.SHOW_ID ? donor.t("remember") : donor.t("enter")}</DialogTitle>
          <DialogContent>
            {idInputMethod === IdInputMethod.SHOW_ID && (
              <Typography variant="body1" sx={{ my: 2, fontWeight: "bold", textAlign: "center" }}>
                {generatedId}
              </Typography>
            )}
            {idInputMethod === IdInputMethod.MANUALLY && (
              <>
                <TextField label={donor.t("your-id")} value={manualId} onChange={handleManualIdChange} fullWidth sx={{ mt: 1 }} error={!!idError} helperText={<span style={{ minHeight: "1em", display: "block" }}>{idError || "\u00A0"}</span>} disabled={isValidating} />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ mr: 2, mb: 2 }}>
            <Stack spacing={2} direction="row" sx={{ justifyContent: "center" }}>
              <Box>
                <Button onClick={handleDialogClose}>{actions.t("close")}</Button>
              </Box>
              <Box>
                <Button onClick={handleAgree} variant="contained" disabled={idInputMethod === IdInputMethod.MANUALLY && (!!idError || !manualId.trim() || isValidating)}>
                  {actions.t("next")}
                </Button>
              </Box>
            </Stack>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
