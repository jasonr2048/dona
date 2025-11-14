import Box from "@mui/material/Box";
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";

import { CHART_COLORS, CHART_LAYOUT, COMMON_CHART_OPTIONS, TOP_LEGEND } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { DailySentReceivedPoint } from "@models/graphData";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface SentReceivedSlidingWindowChartProps {
  slidingWindowMeanDailyWords: DailySentReceivedPoint[];
  mode: "text" | "audio";
}

const SentReceivedSlidingWindowChart: React.FC<SentReceivedSlidingWindowChartProps> = ({ slidingWindowMeanDailyWords, mode }) => {
  const CHART_NAME = `sliding-window-mean-${mode}-chart`;
  const container_name = `chart-wrapper-${CHART_NAME}`;

  const property = mode === "text" ? "word" : "second";
  const chartTexts = useTranslations(`feedback.interactionIntensity.${property}CountSlidingWindowMean`);

  const chartData = useMemo(() => {
    const labels = slidingWindowMeanDailyWords.map(data => new Date(data.epochSeconds * 1000).toISOString().split("T")[0]);
    const sentData = slidingWindowMeanDailyWords.map(data => data.sentCount);
    const receivedData = slidingWindowMeanDailyWords.map(data => data.receivedCount);

    return {
      labels,
      datasets: [
        {
          label: chartTexts("legend.sent"),
          data: sentData,
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primaryTransparent,
          fill: true,
          pointRadius: 3,
          pointStyle: mode === "audio" ? "cross" : "circle"
        },
        {
          label: chartTexts("legend.received"),
          data: receivedData,
          borderColor: CHART_COLORS.secondary,
          backgroundColor: CHART_COLORS.secondaryTransparent,
          fill: true,
          pointRadius: 3,
          pointStyle: mode === "audio" ? "cross" : "circle"
        }
      ]
    };
  }, [slidingWindowMeanDailyWords, chartTexts]);

  return (
    <Box sx={{ width: "100%", maxWidth: CHART_LAYOUT.maxWidth, mx: "auto" }}>
      <Box id={container_name} position="relative" p={CHART_LAYOUT.paddingX}>
        <Box display="flex" justifyContent="right" alignItems="center" mb={-2}>
          <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} />
        </Box>
        <Box sx={{ width: "100%", minHeight: "250px" }}>
          <Line
            data={chartData}
            options={{
              ...COMMON_CHART_OPTIONS,
              spanGaps: 1000 * 60 * 60 * 24 * 2, // Show gaps from 2 days in the data
              plugins: { legend: TOP_LEGEND },
              scales: {
                x: {
                  type: "time",
                  time: {
                    unit: "month",
                    tooltipFormat: "dd-MM-yyyy",
                    displayFormats: {
                      day: "MM-yyyy"
                    }
                  },
                  title: { display: false },
                  ticks: {
                    ...COMMON_CHART_OPTIONS.scales.x.ticks,
                    maxRotation: 45,
                    minRotation: 45
                  }
                },
                y: {
                  ...COMMON_CHART_OPTIONS.scales.y,
                  title: { display: true, text: chartTexts("yAxis") },
                  beginAtZero: true
                }
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SentReceivedSlidingWindowChart;
