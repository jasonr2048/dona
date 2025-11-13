import Box from "@mui/material/Box";
import { ChartDataset } from "chart.js";
import _ from "lodash";
import { useTranslations } from "next-intl";
import React from "react";
import { Bar } from "react-chartjs-2";

import { BARCHART_OPTIONS, CHART_COLORS, CHART_LAYOUT, PCT_TOOLTIP, TOP_LEGEND } from "@components/charts/chartConfig";
import DownloadButtons from "@components/charts/DownloadButtons";
import { AnswerTimePoint } from "@models/graphData";

const FIRST = "< 1 min";
const SECOND = "1-2 min";
const THIRD = "3-5 min";
const FOURTH = "6-15 min";
const FIFTH = "16-30 min";
const SIXTH = "31-60 min";
const SEVENTH = "> 60 min";

const ranges = [
  { max: 60000, label: FIRST },
  { max: 120000, label: SECOND },
  { max: 300000, label: THIRD },
  { max: 900000, label: FOURTH },
  { max: 1800000, label: FIFTH },
  { max: 3600000, label: SIXTH },
  { max: Infinity, label: SEVENTH }
];

interface ResponseTimeBarChartProps {
  responseTimes: AnswerTimePoint[];
}

const ResponseTimeBarChart: React.FC<ResponseTimeBarChartProps> = ({ responseTimes }) => {
  const CHART_NAME = "response-times-barchart";
  const container_name = `chart-wrapper-${CHART_NAME}`;
  const chartTexts = useTranslations("feedback.responseTimes.responseTimeBarChart");

  const categorizeResponseTime = (timeInMs: number) => {
    return ranges.findIndex(range => timeInMs <= range.max);
  };

  const groupedByIsDonor = _.groupBy(responseTimes, responseTime => responseTime.isFromDonor);

  const countByRange = (group: { responseTimeMs: number }[]) => {
    const counts = Array(ranges.length).fill(0);
    group.forEach(responseTime => {
      counts[categorizeResponseTime(responseTime.responseTimeMs)]++;
    });
    return counts;
  };

  const donorCounts = countByRange(groupedByIsDonor.true || []);
  const contactCounts = countByRange(groupedByIsDonor.false || []);

  const donorTotal = donorCounts.reduce((a, b) => a + b, 0);
  const contactTotal = contactCounts.reduce((a, b) => a + b, 0);

  const donorPercentages = donorCounts.map(count => (donorTotal > 0 ? (count / donorTotal) * 100 : 0));
  const contactPercentages = contactCounts.map(count => (contactTotal > 0 ? (count / contactTotal) * 100 : 0));

  const datasets: ChartDataset<"bar", number[]>[] = [
    {
      label: chartTexts("legend.contacts"),
      data: contactPercentages,
      barPercentage: CHART_LAYOUT.barPercentageNarrow,
      backgroundColor: CHART_COLORS.secondary
    },
    {
      label: chartTexts("legend.donor"),
      data: donorPercentages,
      barPercentage: CHART_LAYOUT.barPercentageWide,
      backgroundColor: CHART_COLORS.primary
    }
  ] as ChartDataset<"bar", number[]>[];

  const data = {
    labels: ranges.map(range => range.label),
    datasets: datasets
  };

  const options = {
    ...BARCHART_OPTIONS,
    plugins: {
      legend: TOP_LEGEND,
      tooltip: PCT_TOOLTIP
    },
    scales: {
      x: {
        ...BARCHART_OPTIONS.scales.x,
        title: { display: true, text: chartTexts("xAxis") },
        stacked: true
      },
      y: {
        ...BARCHART_OPTIONS.scales.y,
        title: { display: true, text: chartTexts("yAxis") }
      }
    }
  };

  return (
    <Box id={container_name} position="relative" p={CHART_LAYOUT.paddingX}>
      <Box display="flex" justifyContent="right" alignItems="center" mb={1}>
        <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} />
      </Box>
      <Box sx={{ width: "100%", height: CHART_LAYOUT.responsiveChartHeight }}>
        <Bar data={data} options={options} />
      </Box>
    </Box>
  );
};

export default ResponseTimeBarChart;
