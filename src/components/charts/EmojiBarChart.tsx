import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement, ChartDataset } from "chart.js";
import { useTranslations } from "next-intl";
import React from "react";
import { Bar } from "react-chartjs-2";

import { BARCHART_OPTIONS, CHART_COLORS, CHART_LAYOUT, TOP_LEGEND } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { EmojiDistribution } from "@models/graphData";

interface EmojiBarChartProps {
  emojiDistribution: EmojiDistribution;
}

const EmojiBarChart: React.FC<EmojiBarChartProps> = ({ emojiDistribution }) => {
  // Ensure required chart elements are registered (bar + line)
  ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement);

  const CHART_NAME = "emoji-barchart";
  const container_name = `chart-wrapper-${CHART_NAME}`;
  const chartTexts = useTranslations("feedback.messageComposition.emojiBarChart");

  // Sorting control: sent | received | total
  const [sortBy, setSortBy] = React.useState<"sent" | "received" | "total">("total");

  // Combine and sort emojis by selected metric
  const allEmojis = new Set([...Object.keys(emojiDistribution.sent), ...Object.keys(emojiDistribution.received)]);
  const emojiRows = Array.from(allEmojis).map(emoji => {
    const sent = emojiDistribution.sent[emoji] || 0;
    const received = emojiDistribution.received[emoji] || 0;
    const total = sent + received;
    return { emoji, sent, received, total };
  });

  emojiRows.sort((a, b) => b[sortBy] - a[sortBy]);

  // Get top 20 emojis
  const topEmojis = emojiRows.slice(0, 20);

  // Check if there's any data
  if (topEmojis.length === 0) {
    return (
      <Box id={container_name} position="relative" p={CHART_LAYOUT.paddingX}>
        <Typography variant="body1" align="center" color="text.secondary">
          {chartTexts("noData")}
        </Typography>
      </Box>
    );
  }

  // Prepare data for the chart
  const labels = topEmojis.map(item => item.emoji);
  const donorCounts = topEmojis.map(item => item.sent || 0);
  const contactCounts = topEmojis.map(item => item.received || 0);
  const totals = topEmojis.map(item => item.total || 0);

  // Create datasets for the chart
  const datasets = [
    {
      label: chartTexts("legend.contacts"),
      data: contactCounts,
      backgroundColor: CHART_COLORS.secondary,
      barPercentage: CHART_LAYOUT.barPercentageNarrower
    },
    {
      label: chartTexts("legend.donor"),
      data: donorCounts,
      backgroundColor: CHART_COLORS.primary,
      barPercentage: CHART_LAYOUT.barPercentageWide
    },
    {
      type: "line" as const,
      label: chartTexts("legend.total"),
      data: totals,
      borderColor: "#555555",
      backgroundColor: "#555555",
      borderWidth: 1,
      borderDash: [4, 2],
      pointRadius: 0,
      tension: 0.2,
      yAxisID: "y2"
    }
  ] as ChartDataset<"bar", number[]>[];

  const data = {
    labels,
    datasets
  };

  const options = {
    ...BARCHART_OPTIONS,
    plugins: {
      legend: TOP_LEGEND,
      tooltip: {
        ...BARCHART_OPTIONS.plugins.tooltip,
        callbacks: {
          title: function (context: any) {
            return context[0].label; // Display the emoji in the tooltip title
          },
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        ...BARCHART_OPTIONS.scales.x,
        title: { display: true, text: chartTexts("xAxis") },
        stacked: true,
        ticks: {
          font: {
            size: 16 // Make emojis larger in the axis
          }
        }
      },
      y: {
        ...BARCHART_OPTIONS.scales.y_no_pct,
        title: { display: true, text: chartTexts("yAxis") }
      },
      y2: {
        ...BARCHART_OPTIONS.scales.y_no_pct,
        position: "right" as const,
        grid: { drawOnChartArea: false },
        title: { display: true, text: chartTexts("yAxisTotal") }
      }
    }
  };

  return (
    <Box id={container_name} position="relative" p={CHART_LAYOUT.paddingX}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <FormControl size="small" sx={{ minWidth: 160 }} className="export-hidden">
          <InputLabel id={`${container_name}-sort-label`}>{chartTexts("sort.label")}</InputLabel>
          <Select labelId={`${container_name}-sort-label`} id={`${container_name}-sort`} value={sortBy} label={chartTexts("sort.label")} onChange={e => setSortBy(e.target.value as any)}>
            <MenuItem value="sent">{chartTexts("sort.options.sent")}</MenuItem>
            <MenuItem value="received">{chartTexts("sort.options.received")}</MenuItem>
            <MenuItem value="total">{chartTexts("sort.options.total")}</MenuItem>
          </Select>
        </FormControl>
        <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} />
      </Box>
      <Box sx={{ width: "100%", height: CHART_LAYOUT.responsiveChartHeight }}>
        <Bar data={data} options={options} />
      </Box>
    </Box>
  );
};

export default EmojiBarChart;
