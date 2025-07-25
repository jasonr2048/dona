import React from "react";
import {Bar} from "react-chartjs-2";
import {BarElement, CategoryScale, Chart as ChartJS, ChartDataset, Legend, LinearScale, Tooltip} from "chart.js";
import DownloadButtons from "@components/charts/DownloadButtons";
import {useTranslations} from "next-intl";
import Box from "@mui/material/Box";
import {CHART_COLORS, CHART_LAYOUT, COMMON_CHART_OPTIONS} from "@components/charts/chartConfig";
import useChartPattern from "@/hooks/useChartPattern";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface WordCountOverallBarChartProps {
    sentWordsTotal: number;
    receivedWordsTotal: number;
    mode: "text" | "audio";
}

const CountsOverallBarChart: React.FC<WordCountOverallBarChartProps> = ({
    sentWordsTotal, receivedWordsTotal, mode
}) => {
    const CHART_NAME = `count-overall-${mode}-barchart`;
    const container_name = `chart-wrapper-${CHART_NAME}`;

    const property = mode === "text" ? "word" : "second";
    const primaryPattern = useChartPattern(CHART_COLORS.primaryLight, CHART_COLORS.primary);
    const secondaryPattern = useChartPattern(CHART_COLORS.secondaryLight, CHART_COLORS.secondary);
    const colors = mode === "text" ?
        [CHART_COLORS.primary, CHART_COLORS.secondary] :
        [primaryPattern, secondaryPattern];
    const chartTexts = useTranslations(`feedback.interactionIntensity.${property}CountOverallBarChart`);

    const generateChartData = () => {
        return {
            labels: [chartTexts("yAxis.sent"), chartTexts("yAxis.received")],
            datasets: [
                {
                    data: [sentWordsTotal, receivedWordsTotal],
                    backgroundColor: colors,
                    maxBarThickness: CHART_LAYOUT.maxHBarThickness
                },
            ] as ChartDataset<"bar", number[]>[],
        };
    };

    return (
        <Box sx={{ width: "100%", maxWidth: CHART_LAYOUT.maxWidth, mx: "auto" }}>
            <Box id={container_name} position="relative" p={CHART_LAYOUT.paddingX}>
                <Box display="flex" justifyContent="right" alignItems="center" mb={-2}>
                    <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} />
                </Box>
                <Box sx={{ width: "100%", minHeight: "250px" }}>
                    <Bar
                        data={generateChartData()}
                        options={{
                            ...COMMON_CHART_OPTIONS,
                            indexAxis: "y",
                            scales: {
                                x: {
                                    ...COMMON_CHART_OPTIONS.scales.x,
                                    title: { display: true, text: chartTexts("xAxis") },
                                },
                                y: {
                                    ...COMMON_CHART_OPTIONS.scales.y,
                                    grid: { drawOnChartArea: false }
                                },
                            },
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default CountsOverallBarChart;
