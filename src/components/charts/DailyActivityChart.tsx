import { Box } from "@mui/material";
import { Chart as ChartJS, Legend, LinearScale, PointElement, TimeScale, Title, Tooltip } from "chart.js";
import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
import { Scatter } from "react-chartjs-2";

import "chartjs-adapter-date-fns";
import { CHART_LAYOUT, COMMON_CHART_OPTIONS } from "@components/charts/chartConfig";
import ColorScale from "@components/charts/ColorScale";
import DownloadButtons from "@components/charts/DownloadButtons";
import { DailyHourPoint } from "@models/graphData";
import { adjustRange } from "@services/charts/preprocessing";
import { calculateZScores } from "@services/charts/zScores";

import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

ChartJS.register(Title, Tooltip, Legend, LinearScale, PointElement, TimeScale);

const ALL_CHATS = "ALL_CHATS";
const Z_SCORE_LIMIT = 1.39;
const backgroundColor = (a: number): string => `rgba(18, 90, 180, ${a})`;

interface DailyActivityChartProps {
  dataSentPerConversation: DailyHourPoint[][];
  listOfConversations: string[];
}

const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ dataSentPerConversation, listOfConversations }) => {
  const CHART_NAME = "daily-activity-times-scatter-plot";
  const container_name = `chart-wrapper-${CHART_NAME}`;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const labelTexts = useTranslations("feedback.chartLabels");
  const chartTexts = useTranslations("feedback.dailyActivityTimes.dailyActivityHoursChart");
  const [selectedConversation, setSelectedConversation] = useState<string>(ALL_CHATS);

  const preprocessData = (data: DailyHourPoint[]) => {
    const allData = data.map(point => ({
      x: `${point.year}-${String(point.month).padStart(2, "0")}-${String(point.date).padStart(2, "0")}`,
      y: `1970-01-01T${String(point.hour).padStart(2, "0")}:${String(point.minute).padStart(2, "0")}:00`,
      wordCount: point.wordCount
    }));

    const zScores = calculateZScores(
      allData.map(d => d.wordCount),
      Z_SCORE_LIMIT
    ) as number[];
    return allData.map((d, i) => ({
      ...d,
      z: zScores[i]
    }));
  };

  // For all data available (flatten all conversations)
  const preparedData = useMemo(() => {
    const flat: DailyHourPoint[] = dataSentPerConversation.flat();
    return preprocessData(flat);
  }, [dataSentPerConversation]);

  // For the selection by dropdown
  const filteredData = useMemo(() => {
    if (selectedConversation === ALL_CHATS) return preparedData;
    const conversationIndex = listOfConversations.indexOf(selectedConversation);
    const selectedArray = dataSentPerConversation[conversationIndex] || [];
    return preprocessData(selectedArray);
  }, [preparedData, selectedConversation, dataSentPerConversation, listOfConversations]);

  const { xMin, xMax } = adjustRange(
    filteredData.map(point => point.x),
    0.05
  );

  const data = {
    datasets: [
      {
        data: filteredData,
        backgroundColor: (context: any) => {
          const value = context.raw?.z || 0;
          // Adjust opacity based on number of points (max 1, min 0.25)
          const baseOpacity = Math.abs((value + Z_SCORE_LIMIT) / (2 * Z_SCORE_LIMIT));
          const opacity = filteredData.length < 200 ? 1 : 0.25;
          return backgroundColor(baseOpacity * opacity);
        },
        borderWidth: 0,
        pointStyle: "circle"
      }
    ]
  };

  const options = {
    ...COMMON_CHART_OPTIONS,
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "month" as const,
          tooltipFormat: "dd-MM-yyyy",
          displayFormats: {
            day: "MM-yyyy"
          }
        },
        ticks: {
          maxTicksLimit: isMobile ? 6 : 20,
          minRotation: 30,
          includeBounds: true
        },
        min: xMin,
        max: xMax
      },
      y: {
        type: "time" as const,
        time: {
          unit: "hour" as const,
          displayFormats: { hour: "HH:mm" }
        },
        title: {
          display: true,
          text: chartTexts("yAxis")
        }
      }
    },
    plugins: {
      ...COMMON_CHART_OPTIONS.plugins,
      tooltip: {
        enabled: false
      }
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 2, alignItems: "center", width: "100%" }}>
      <Box sx={{ flex: 1, position: "relative", width: "100%" }}>
        <Select value={selectedConversation} onChange={e => setSelectedConversation(e.target.value)} size="small" variant="outlined" sx={{ mb: -2, pb: 0, fontSize: CHART_LAYOUT.labelFontSize }}>
          <MenuItem value={ALL_CHATS} sx={{ fontSize: CHART_LAYOUT.labelFontSize }}>
            {labelTexts("overallData")}
          </MenuItem>
          {listOfConversations.map(conversation => (
            <MenuItem sx={{ fontSize: CHART_LAYOUT.labelFontSize }} key={conversation} value={conversation}>
              {conversation}
            </MenuItem>
          ))}
        </Select>

        <Box id={container_name} p={CHART_LAYOUT.paddingX} sx={{ mt: -2, pt: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" align="right" fontWeight="bold" mt={1} sx={{ fontSize: CHART_LAYOUT.labelFontSize }}>
              {selectedConversation === ALL_CHATS ? labelTexts("overallData") : selectedConversation}
            </Typography>
            <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} currentLabel={selectedConversation} />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              height: CHART_LAYOUT.responsiveChartHeight,
              ml: -1.5
            }}
          >
            <Box sx={{ flex: 1, height: "100%", maxWidth: "100%" }}>
              <Scatter data={data} options={options} />
            </Box>
            <ColorScale colors={[backgroundColor(1), "white"]} labels={[chartTexts("moreThanAverage"), chartTexts("average"), chartTexts("lessThanAverage")]} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DailyActivityChart;
