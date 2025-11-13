import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import React from "react";

import { BasicStatistics } from "@models/graphData";

const CARD_COLOR_PRIMARY = "#f5f5f5";
const CARD_COLOR_SECONDARY = "#e3f2fd";

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(0)}%`;
};

export default function StatisticsCard({ stats }: { stats: BasicStatistics }) {
  const t = useTranslations("feedback.statisticsCard");
  const thousandSeparator = t("thousand-separator");

  const formatWithSeparator = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  };

  const renderStatBox = (value: number, label: string, caption: string, bgcolor: string) => (
    <Box sx={{ textAlign: "center", bgcolor, p: 2, borderRadius: 1 }}>
      <Typography variant="h6">{formatWithSeparator(value)}</Typography>
      <Typography variant="body2">{label.toUpperCase()}</Typography>
      <Typography variant="caption">{caption}</Typography>
    </Box>
  );
  const renderTypeBreakdownBox = (valueText: number, valueAudio: number, valueTotal: number, bgcolor: string) => (
    <Box sx={{ textAlign: "center", bgcolor, p: 2, borderRadius: 1 }}>
      <Typography variant="body2">
        ✏️ {formatWithSeparator(valueText)} {t("text")} ({formatPercentage(valueText, valueTotal)})
      </Typography>
      <Typography variant="body2">
        🎙️ {formatWithSeparator(valueAudio)} {t("audio")} ({formatPercentage(valueAudio, valueTotal)})
      </Typography>
    </Box>
  );

  const renderSection = (title: string, explanation: string, boxes: React.ReactNode[]) => (
    <Box
      sx={{
        p: 2,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        textAlign: "center",
        bgcolor: "background.paper"
      }}
    >
      <Typography variant="body2" fontWeight="fontWeightBold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2">{explanation}</Typography>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {boxes.map((box, index) => (
          <Grid key={index} size={{ xs: 6 }}>
            {box}
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Grid container spacing={2}>
      {/* Messages */}
      <Grid size={{ xs: 12, md: 6 }}>{renderSection(t("total-messages"), t("active-years-explanation_format", { years: stats.numberOfActiveYears }), [renderStatBox(stats.messagesTotal.allMessages.sent, t("messages"), t("sent"), CARD_COLOR_PRIMARY), renderStatBox(stats.messagesTotal.allMessages.received, t("messages"), t("received"), CARD_COLOR_SECONDARY), renderTypeBreakdownBox(stats.messagesTotal.textMessages.sent, stats.messagesTotal.audioMessages.sent, stats.messagesTotal.allMessages.sent, CARD_COLOR_PRIMARY), renderTypeBreakdownBox(stats.messagesTotal.textMessages.received, stats.messagesTotal.audioMessages.received, stats.messagesTotal.allMessages.received, CARD_COLOR_SECONDARY)])}</Grid>
      <Grid size={{ xs: 12, md: 6 }}>{renderSection(t("average-per-active-month"), t("active-months-explanation_format", { months: stats.numberOfActiveMonths }), [renderStatBox(stats.messagesPerActiveMonth.allMessages.sent, t("messages"), t("sent"), CARD_COLOR_PRIMARY), renderStatBox(stats.messagesPerActiveMonth.allMessages.received, t("messages"), t("received"), CARD_COLOR_SECONDARY), renderTypeBreakdownBox(stats.messagesPerActiveMonth.textMessages.sent, stats.messagesPerActiveMonth.audioMessages.sent, stats.messagesPerActiveMonth.allMessages.sent, CARD_COLOR_PRIMARY), renderTypeBreakdownBox(stats.messagesPerActiveMonth.textMessages.received, stats.messagesPerActiveMonth.audioMessages.received, stats.messagesPerActiveMonth.allMessages.received, CARD_COLOR_SECONDARY)])}</Grid>
    </Grid>
  );
}
