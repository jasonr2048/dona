import { useTranslations } from "next-intl";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DatasourceSpecificInstructions from "@components/DatasourceSpecificInstructions";
import ConsentModal from "@/components/ConsentModal";
import { useRichTranslations } from "@/hooks/useRichTranslations";
import { DataSourceValue } from "@models/processed";
import { FacebookIcon, IMessageIcon, InstagramIcon, WhatsAppIcon } from "@components/CustomIcon";

export default function Instructions() {
  const a = useTranslations("actions");
  const instructions = useRichTranslations("instructions");

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1 }}>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box>
          <Typography variant="h4">{instructions.t("about.title")}</Typography>
          <Typography variant="body1">{instructions.rich("about.body")}</Typography>
        </Box>
        <Box sx={{ my: 4 }}>
          {/* WhatsApp */}
          <Accordion sx={{ my: 1 }}>
            <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
              <WhatsAppIcon sx={{ mr: 1, mt: 0.5 }} />
              <Typography variant="h6">
                {instructions.t("datasource.title_format", { datasource: "Whatsapp" })}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DatasourceSpecificInstructions dataSource={DataSourceValue.WhatsApp} />
            </AccordionDetails>
          </Accordion>
          {/* Facebook */}
          <Accordion sx={{ my: 1 }}>
            <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
              <FacebookIcon sx={{ mr: 1, mt: 0.5 }} />
              <Typography variant="h6">
                {instructions.t("datasource.title_format", { datasource: "Facebook" })}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DatasourceSpecificInstructions dataSource={DataSourceValue.Facebook} />
            </AccordionDetails>
          </Accordion>
          {/* Instagram */}
          <Accordion sx={{ my: 1 }}>
            <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
              <InstagramIcon sx={{ mr: 1, mt: 0.5 }} />
              <Typography variant="h6">
                {instructions.t("datasource.title_format", { datasource: "Instagram" })}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DatasourceSpecificInstructions dataSource={DataSourceValue.Instagram} />
            </AccordionDetails>
          </Accordion>
          {/* iMessage */}
          <Accordion sx={{ my: 1 }}>
            <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
              <IMessageIcon sx={{ mr: 1, mt: 0.5 }} />
              <Typography variant="h6">
                {instructions.t("datasource.title_format", { datasource: "iMessage" })}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DatasourceSpecificInstructions dataSource={DataSourceValue.IMessage} />
            </AccordionDetails>
          </Accordion>
        </Box>
        <Box>
          <Typography variant="body1">{instructions.t("continue.body")}</Typography>
          <Typography variant="h5" sx={{ margin: 3 }}>
            {instructions.t("continue.buttonsHeader")}
          </Typography>
          <Stack spacing={2} direction="row" sx={{ justifyContent: "center" }}>
            <Button variant="contained" href="/">
              {a("previous")}
            </Button>
            <ConsentModal />
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
