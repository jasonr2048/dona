import React from "react";
import {Bar} from "react-chartjs-2";
import {BarElement, CategoryScale, Chart as ChartJS, ChartDataset, Legend, LinearScale, Tooltip} from "chart.js";
import DownloadButtons from "@components/charts/DownloadButtons";
import {useTranslations} from "next-intl";
import Box from "@mui/material/Box";
import {BARCHART_OPTIONS, CHART_COLORS, CHART_LAYOUT} from "@components/charts/chartConfig";
import {BasicStatistics} from "@models/graphData";
import useChartPattern from "@/hooks/useChartPattern";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface MessageTypesBarChartProps {
    basicStatistics: BasicStatistics;
}

const MessageTypesBarChart: React.FC<MessageTypesBarChartProps> = ({
    basicStatistics
}) => {
    const CHART_NAME = "message-types-barchart";
    const container_name = `chart-wrapper-${CHART_NAME}`;
    const chartTexts = useTranslations("feedback.messageComposition.messageTypesBarChart");
    const primaryPattern = useChartPattern(CHART_COLORS.primaryLight, CHART_COLORS.primary);
    const secondaryPattern = useChartPattern(CHART_COLORS.secondaryLight, CHART_COLORS.secondary);

    const generateChartData = () => {
        return {
            labels: [chartTexts("types.text"), chartTexts("types.audio")],
            datasets: [
                {
                    label: chartTexts("legend.contacts"),
                    data: [
                        basicStatistics.messagesTotal.textMessages.received,
                        basicStatistics.messagesTotal.audioMessages.received
                    ],
                    backgroundColor: [CHART_COLORS.secondary, secondaryPattern],
                    maxBarThickness: CHART_LAYOUT.maxBarThickness * CHART_LAYOUT.barPercentageNarrow
                },
                {
                    label: chartTexts("legend.donor"),
                    data: [
                        basicStatistics.messagesTotal.textMessages.sent,
                        basicStatistics.messagesTotal.audioMessages.sent
                    ],
                    backgroundColor: [CHART_COLORS.primary, primaryPattern],
                    maxBarThickness: CHART_LAYOUT.maxBarThickness * CHART_LAYOUT.barPercentageWide,
                },
            ] as ChartDataset<"bar", number[]>[],
        };
    };

    return (
        <Box id={container_name} position="relative" p={CHART_LAYOUT.paddingX}>
            <Box display="flex" justifyContent="right" alignItems="center" mb={1}>
                <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} />
            </Box>
            <Box sx={{ width: "100%", height: CHART_LAYOUT.responsiveChartHeight }}>
                <Bar
                    data={generateChartData()}
                    options={{
                        ...BARCHART_OPTIONS,
                        scales: {
                            x: {
                                ...BARCHART_OPTIONS.scales.x,
                                title: { display: true, text: chartTexts("xAxis") },
                                stacked: true,
                            },
                            y: {
                                ...BARCHART_OPTIONS.scales.y_no_pct,
                                title: { display: true, text: chartTexts("yAxis") },
                            },
                        },
                        plugins: {
                            ...BARCHART_OPTIONS.plugins,
                            tooltip: {
                                callbacks: {
                                    label: (context: any) => `${context.raw}` // Show exact number on hover
                                }
                            }
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default MessageTypesBarChart;
