"use client";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import ConsentModal from "@/components/ConsentModal";
import { LinkButton } from "@/components/LinkButton";
import UploadTestSelector from "@/components/UploadTestSelector";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { MainTitle, RichText } from "@/styles/StyledTypography";
import { FacebookIcon, IMessageIcon, InstagramIcon, WhatsAppIcon } from "@components/CustomIcon";
import { DataSourceValue } from "@models/processed";

export default function UploadTestPage() {
  const actions = useTranslations("actions");
  const testUpload = useRichTranslations("testUpload");

  const [validBySource, setValidBySource] = useState<Record<DataSourceValue, boolean>>({} as Record<DataSourceValue, boolean>);

  const hasValidSource = useMemo(() => Object.values(validBySource).some(Boolean), [validBySource]);

  const handleValidationChange = (source: DataSourceValue, isValid: boolean) => {
    setValidBySource(prev => ({
      ...prev,
      [source]: isValid
    }));
  };

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1 }}>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center"
        }}
      >
        <MainTitle variant="h4">{testUpload.t("title")}</MainTitle>
        <RichText>{testUpload.t("placeholder")}</RichText>

        <Box sx={{ my: 4, minWidth: "80%", textAlign: "left" }}>
          {[DataSourceValue.WhatsApp, DataSourceValue.Facebook, DataSourceValue.Instagram, DataSourceValue.IMessage].map(source => (
            <Accordion key={source} sx={{ my: 1 }}>
              <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                {source === DataSourceValue.WhatsApp && <WhatsAppIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.Facebook && <FacebookIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.Instagram && <InstagramIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.IMessage && <IMessageIcon sx={{ mr: 1, mt: 0.5 }} />}
                <Typography variant="h6">
                  {testUpload.t("datasourceTitle_format", {
                    datasource: source == DataSourceValue.IMessage ? "iMessage" : source
                  })}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <UploadTestSelector dataSourceValue={source} onValidationChange={isValid => handleValidationChange(source, isValid)} />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box>
          <Stack spacing={2} direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "center", alignItems: "center" }}>
            <LinkButton variant="contained" href="/instructions">
              {actions("previous")}
            </LinkButton>
            {hasValidSource ? <ConsentModal /> : <Typography variant="body2">{testUpload.t("consentHint")}</Typography>}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
