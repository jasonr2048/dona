"use client";

import { useRichTranslations } from "@/hooks/useRichTranslations";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";
import { BlockTitle } from "@/styles/StyledTypography";
import {
  InstructionVideo,
  StepsList,
  TabbedInstructionVideo,
} from "@/components/InstructionComponents";
import { DataSourceValue } from "@models/processed";

export default function DatasourceSpecificInstructions({
  dataSource,
}: {
  dataSource: DataSourceValue;
}) {
  const source = useRichTranslations(dataSource.toLowerCase());
  const generic = useRichTranslations("instructions");

  const isWhatsApp = dataSource === DataSourceValue.WhatsApp;
  const secondParagraph = isWhatsApp ? "selection" : "duration";
  const stepsCount = dataSource === DataSourceValue.IMessage ? 6 : isWhatsApp ? 8 : 10;
  const verticalVideo = isWhatsApp || dataSource === DataSourceValue.Instagram;

  const externalLinks = {
    link_android: `${dataSource.toLowerCase()}.androidDocumentation`,
    link_ios: `${dataSource.toLowerCase()}.iosDocumentation`,
    link: `${dataSource.toLowerCase()}.externalDocumentation`,
  };

  const FirstBlock = ({ halfWidth = false }: { halfWidth?: boolean }) => (
    <Grid size={{ xs: 12, md: halfWidth ? 6 : 10 }}>
      <BlockTitle>{generic.t("headers.devices")}</BlockTitle>
      <Typography>{source.rich("devices.body")}</Typography>

      <BlockTitle>{source.t(`${secondParagraph}.title`)}</BlockTitle>
      <Typography>{source.rich(`${secondParagraph}.body`)}</Typography>

      <BlockTitle>{generic.t("headers.dataDeletion")}</BlockTitle>
      <Typography>
        {source.rich("dataDeletion.body", {
          link: "secureDelete",
          link_datenschutz: "datenschutz",
          link_android: "deleteFromAndroid",
          link_ios: "deleteFromIos",
        })}
      </Typography>
    </Grid>
  );

  return (
    <Grid container spacing={2} mt={-2} justifyContent="center" alignItems="flex-start">
      {verticalVideo ? (
        <Grid container spacing={2} alignItems="flex-start">
          <FirstBlock halfWidth />
          <Grid size={{ xs: 12, md: 6 }}>
            {isWhatsApp ? (
              <TabbedInstructionVideo
                iosVideoUrl={source.t("video.ios")}
                androidVideoUrl={source.t("video.android")}
                iosCaption={source.t("video.iosCaption")}
                androidCaption={source.t("video.androidCaption")}
              />
            ) : (
              <InstructionVideo videoUrl={source.t("video")} />
            )}
          </Grid>
        </Grid>
      ) : (
        <>
          <FirstBlock />
          <InstructionVideo videoUrl={source.t("video")} />
        </>
      )}

      <StepsList title={generic.t("headers.overview")} translation={source} count={stepsCount} />

      <Grid size={{ xs: 12, md: 10 }}>
        <Typography>{source.rich("externalDocumentation", externalLinks)}</Typography>
      </Grid>
    </Grid>
  );
}
