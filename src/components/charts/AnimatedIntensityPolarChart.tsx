import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Chart as ChartJS, Legend, LineElement, PointElement, RadialLinearScale, Tooltip } from "chart.js";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { Radar } from "react-chartjs-2";

import { POLAR_CHART_COLORS, PCT_TOOLTIP } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { SentReceivedPoint } from "@models/graphData";
import { prepareCountsOverTimeData } from "@services/charts/animations";
import { calculateZScores } from "@services/charts/zScores";

import SliderWithButtons from "./SliderWithButtons";

ChartJS.register(RadialLinearScale, Tooltip, Legend, LineElement, PointElement);

const Z_SCORE_LIMIT = 1.96;
const BACKGROUND_IMAGE = "images/charts/FeedbackBackgroundForPolarPlot.svg";

interface AnimatedIntensityPolarChartProps {
  dataMonthlyPerConversation: Record<string, SentReceivedPoint[]>;
}

const AnimatedIntensityPolarChart: React.FC<AnimatedIntensityPolarChartProps> = ({ dataMonthlyPerConversation }) => {
  const CHART_NAME = "intensity-interaction-polar";
  const container_name = `chart-wrapper-${CHART_NAME}`;

  const labelTexts = useTranslations("feedback.chartLabels");
  const chartTexts = useTranslations("feedback.interactionIntensity.animatedIntensityPolarChart");

  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [labels, setLabels] = useState<string[]>([]);
  const [frames, setFrames] = useState<Record<string, number[]>>({});
  const [counts, setCounts] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const { counts: preparedCounts, sortedMonths } = prepareCountsOverTimeData(dataMonthlyPerConversation);
    const zScoreFrames = calculateZScores(preparedCounts, Z_SCORE_LIMIT) as Record<string, number[]>;
    setLabels(sortedMonths);
    setFrames(zScoreFrames);
    setCounts(preparedCounts); // Store original counts for tooltip usage
  }, [dataMonthlyPerConversation]);

  const generateChartData = (frameIndex: number) => {
    const monthKey = labels[frameIndex];
    const conversationData = frames[monthKey] || [];

    return {
      labels: Object.keys(dataMonthlyPerConversation),
      datasets: [
        {
          label: chartTexts("legend.others"),
          data: conversationData, // Radial values (z-scores)
          pointBackgroundColor: POLAR_CHART_COLORS.drawing,
          pointRadius: 10,
          pointHoverRadius: 12,
          borderWidth: 0
        },
        // Donor data
        {
          label: chartTexts("legend.donor"),
          data: [Z_SCORE_LIMIT + Z_SCORE_LIMIT * 0.5],
          pointBackgroundColor: POLAR_CHART_COLORS.highlight,
          pointRadius: 15,
          pointHoverRadius: 17,
          borderWidth: 0
        }
      ]
    };
  };

  return (
    <Box>
      <Box id={container_name} position="relative" p={2} mb={1}>
        <Box position="relative" display="flex" justifyContent="space-between" alignItems="center" sx={{ zIndex: 1, ml: 1, mb: -4, color: "#ccc" }}>
          <Typography variant="body2" align="right" sx={{ color: "#ccc" }}>
            <b>{labelTexts("currentMonth")}</b> {labels[currentFrame]}
          </Typography>
          <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} currentLabel={labels[currentFrame]} color="#d5d5d5" labelsBelow={true} />
        </Box>
        <Box
          position="relative"
          flex="1"
          px={2}
          pb={3}
          pt={5}
          sx={{
            zIndex: 0,
            backgroundImage: `url(${BACKGROUND_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "100%",
            height: "400px"
          }}
        >
          <Radar
            data={generateChartData(currentFrame)}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 300 },
              scales: {
                r: {
                  reverse: true,
                  beginAtZero: true,
                  min: -Z_SCORE_LIMIT * 0.8,
                  max: Z_SCORE_LIMIT + Z_SCORE_LIMIT * 0.5,
                  ticks: { count: 1, display: false },
                  angleLines: { display: false },
                  grid: {
                    circular: true,
                    color: POLAR_CHART_COLORS.drawing
                  },
                  pointLabels: {
                    color: POLAR_CHART_COLORS.drawing,
                    font: { size: 14 }
                  }
                }
              },
              plugins: {
                legend: {
                  position: "chartArea",
                  align: "start",
                  display: true,
                  labels: {
                    usePointStyle: true,
                    textAlign: "left",
                    color: POLAR_CHART_COLORS.drawing
                  }
                },
                tooltip: {
                  ...PCT_TOOLTIP,
                  callbacks: {
                    label: (context: any) => {
                      const dataIndex = context.dataIndex;
                      const monthKey = labels[currentFrame];
                      const value = counts[monthKey]?.[dataIndex] ?? 0;
                      return `${labelTexts("numberMessages")}: ${value}`;
                    }
                  }
                }
              }
            }}
          />
        </Box>
      </Box>

      <SliderWithButtons value={currentFrame} marks={labels.map((label, index) => ({ value: index, label }))} setCurrentFrame={setCurrentFrame} />
    </Box>
  );
};

export default AnimatedIntensityPolarChart;
