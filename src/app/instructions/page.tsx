"use client";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import { LinkButton } from "@/components/LinkButton";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { ENABLED_DATA_SOURCES } from "@/config";
import { FacebookIcon, IMessageIcon, InstagramIcon, WhatsAppIcon } from "@components/CustomIcon";
import DatasourceSpecificInstructions from "@components/DatasourceSpecificInstructions";
import { DataSourceValue } from "@models/processed";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const isUploadTestEnabled = process.env.NEXT_PUBLIC_UPLOAD_TEST_ENABLED !== "false";

const sampleDataFiles = [
  {
    key: "whatsapp",
    href: "https://uni-bielefeld.sciebo.de/s/EDdRfJzO8p9ndNZ",
    external: true
  },
  {
    key: "instagram",
    href: "/documents/sample-data/artificial_instagram_export_valid.zip",
    external: false
  },
  {
    key: "imessage",
    href: "/documents/sample-data/valid_data.db",
    external: false
  }
] as const;

const getDataSourceLabel = (source: DataSourceValue) => {
  if (source === DataSourceValue.IMessage) return "iMessage";
  if (source === DataSourceValue.WhatsApp) return "Whatsapp";
  return source;
};

export default function Instructions() {
  const a = useTranslations("actions");
  const instructions = useRichTranslations("instructions");
  const feedback = useRichTranslations("feedback");

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
        <Box>
          <Typography variant="h4">{instructions.t("about.title")}</Typography>
          <Typography variant="body1">{instructions.rich("about.body")}</Typography>
        </Box>

        {isDemoMode && (
          <Box
            sx={{
              width: "100%",
              border: "2px solid",
              borderColor: "primary.main",
              borderRadius: 2,
              p: 2,
              textAlign: "left",
              mt: 3
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
                <Button
                  key={file.key}
                  variant="outlined"
                  component="a"
                  href={file.href}
                  download={file.external ? undefined : true}
                  target={file.external ? "_blank" : undefined}
                  rel={file.external ? "noopener noreferrer" : undefined}
                >
                  {feedback.t(`sampleData.${file.key}`)}
                </Button>
              ))}
            </Stack>
          </Box>
        )}

        <Box sx={{ my: 4 }}>
          {ENABLED_DATA_SOURCES.map(source => (
            <Accordion key={source} sx={{ my: 1 }}>
              <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                {source === DataSourceValue.WhatsApp && <WhatsAppIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.Facebook && <FacebookIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.Instagram && <InstagramIcon sx={{ mr: 1, mt: 0.5 }} />}
                {source === DataSourceValue.IMessage && <IMessageIcon sx={{ mr: 1, mt: 0.5 }} />}
                <Typography variant="h6">
                  {instructions.t("datasource.title_format", { datasource: getDataSourceLabel(source) })}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <DatasourceSpecificInstructions dataSource={source} />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        <Box>
          <Typography variant="body1">{instructions.t("continue.body")}</Typography>
          <Typography variant="h5" sx={{ margin: 3 }}>
            {instructions.t("continue.buttonsHeader")}
          </Typography>
          <Stack spacing={2} direction="row" sx={{ justifyContent: "center" }}>
            <LinkButton variant="contained" href="/">
              {a("previous")}
            </LinkButton>
            <LinkButton variant="contained" href={isUploadTestEnabled ? "/upload-test" : "/data-donation"}>
              {a("next")}
            </LinkButton>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
