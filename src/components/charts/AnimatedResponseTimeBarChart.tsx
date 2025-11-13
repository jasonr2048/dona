import React, { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import SliderWithButtons from "@components/charts/SliderWithButtons";
import DownloadButtons from "@components/charts/DownloadButtons";
import { GraphData } from "@models/graphData";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  CHART_BOX_PROPS,
  CHART_COLORS,
  CHART_LAYOUT,
  BARCHART_OPTIONS,
} from "@components/charts/chartConfig";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface AnimatedResponseTimeBarChartProps {
  answerTimes: GraphData["answerTimes"];
}

const AnimatedResponseTimeBarChart: React.FC<AnimatedResponseTimeBarChartProps> = ({
  answerTimes,
}) => {
  const CHART_NAME = "response-times-donor-barchart";
  const container_name = `chart-wrapper-${CHART_NAME}`;

  const labelTexts = useTranslations("feedback.chartLabels");
  const chartTexts = useTranslations("feedback.responseTimes.responseTimeBarChartMonthly");

  const chartRef = useRef<any>(null);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [preparedData, setPreparedData] = useState<Record<string, number[]> | null>(null);
  const [labels, setLabels] = useState<string[]>([]);

  const timeRanges = [
    { label: "< 1 min", max: 60000 },
    { label: "1-2 min", max: 120000 },
    { label: "3-5 min", max: 300000 },
    { label: "6-15 min", max: 900000 },
    { label: "16-30 min", max: 1800000 },
    { label: "31-60 min", max: 3600000 },
    { label: "> 60 min", max: Infinity },
  ];

  const preprocessData = () => {
    const groupedByMonth: Record<string, number[]> = {};

    // Group data by month and range
    answerTimes.forEach(({ timestampMs, responseTimeMs, isFromDonor }) => {
      const date = new Date(timestampMs);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = new Array(timeRanges.length).fill(0);
      }

      if (isFromDonor) {
        const rangeIndex = timeRanges.findIndex(({ max }) => responseTimeMs <= max);
        if (rangeIndex !== -1) {
          groupedByMonth[monthKey][rangeIndex] += 1;
        }
      }
    });

    // Normalize data to percentages and ensure empty months are included
    const sortedMonths = Object.keys(groupedByMonth).sort();
    sortedMonths.forEach((monthKey) => {
      const totalResponses = groupedByMonth[monthKey].reduce((a, b) => a + b, 0);
      groupedByMonth[monthKey] = totalResponses
        ? groupedByMonth[monthKey].map((count) => (count / totalResponses) * 100)
        : new Array(timeRanges.length).fill(0);
    });

    return { counts: groupedByMonth, sortedMonths };
  };

  useEffect(() => {
    const { counts, sortedMonths } = preprocessData();
    setPreparedData(counts);
    setLabels(sortedMonths);
  }, [answerTimes]);

  const generateChartData = (frameIndex: number) => {
    const monthKey = labels[frameIndex];
    return {
      labels: timeRanges.map(({ label }) => label),
      datasets: [
        {
          label: chartTexts("legend.donor"),
          data: preparedData?.[monthKey] || [],
          backgroundColor: CHART_COLORS.primary,
          barThickness: CHART_LAYOUT.hBarThickness,
        },
      ],
    };
  };

  return (
    <Box sx={CHART_BOX_PROPS.main}>
      <Box
        id={container_name}
        position="relative"
        px={CHART_LAYOUT.paddingX}
        py={CHART_LAYOUT.paddingY}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography
            variant="body2"
            align="right"
            fontWeight="bold"
            mt={1}
            sx={{ fontSize: CHART_LAYOUT.labelFontSize }}
          >
            {labelTexts("currentMonth")} {labels[currentFrame]}
          </Typography>
          <DownloadButtons
            chartId={container_name}
            fileNamePrefix={CHART_NAME}
            currentLabel={labels[currentFrame]}
          />
        </Box>

        <Box
          sx={{
            width: "100%",
            height: CHART_LAYOUT.responsiveChartHeight,
            minHeight: CHART_LAYOUT.mobileChartHeight,
            ml: -1,
          }}
        >
          <Bar
            ref={chartRef}
            data={generateChartData(currentFrame)}
            options={{
              ...BARCHART_OPTIONS,
              scales: {
                x: {
                  ...BARCHART_OPTIONS.scales.x,
                  title: { display: true, text: chartTexts("xAxis") },
                },
                y: {
                  ...BARCHART_OPTIONS.scales.y,
                  title: { display: true, text: chartTexts("yAxis") },
                },
              },
            }}
          />
        </Box>
      </Box>

      <SliderWithButtons
        value={currentFrame}
        marks={labels.map((label, index) => ({ value: index, label }))}
        setCurrentFrame={setCurrentFrame}
      />
    </Box>
  );
};

export default AnimatedResponseTimeBarChart;
