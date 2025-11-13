import Box from "@mui/material/Box";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid2";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";

import { BlockTitle } from "@/styles/StyledTypography";

interface TabbedInstructionVideoProps {
  iosVideoUrl: string;
  androidVideoUrl: string;
  iosCaption: string;
  androidCaption: string;
}

interface TabbedInstructionVideoProps {
  iosVideoUrl: string;
  androidVideoUrl: string;
  iosCaption: string;
  androidCaption: string;
}

export function TabbedInstructionVideo({ iosVideoUrl, androidVideoUrl, iosCaption, androidCaption }: TabbedInstructionVideoProps) {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center" mt={2}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
        <Tabs value={value} onChange={handleChange} centered>
          <Tab label="iOS" />
          <Tab label="Android" />
        </Tabs>
      </Box>
      <Box width="100%" display="flex" justifyContent="center" position="relative">
        <CardMedia component="video" image={iosVideoUrl} title="iOS Instructions" controls sx={{ display: value === 0 ? "block" : "none", width: "100%" }} />
        <CardMedia component="video" image={androidVideoUrl} title="Android Instructions" controls sx={{ display: value === 1 ? "block" : "none", width: "100%" }} />
      </Box>
      <Typography variant="caption" sx={{ mt: 1 }}>
        {value === 0 ? iosCaption : androidCaption}
      </Typography>
    </Box>
  );
}

export const InstructionVideo = ({ videoUrl }: { videoUrl: string }) => (
  <Grid size={{ xs: 12, md: 10 }}>
    <Box sx={{ width: "100%", maxWidth: "800px", mx: "auto" }}>
      <CardMedia component="video" image={videoUrl} title="Instructions" controls />
    </Box>
  </Grid>
);

export const StepsList = ({ title, translation, count }: { title: string; translation: any; count: number }) => (
  <Grid size={{ xs: 12, md: 10 }}>
    <BlockTitle>{title}</BlockTitle>
    <Box component="ol" sx={{ textAlign: "left", lineHeight: "1.75rem", paddingLeft: 3 }}>
      {[...Array(count)].map((_, i) => (
        <li key={`step-${i + 1}`}>{translation.rich(`steps.${i + 1}`)}</li>
      ))}
    </Box>
  </Grid>
);
