import React, {useEffect, useRef, useState} from "react";
import {Bar} from "react-chartjs-2";
import {BarElement, CategoryScale, Chart as ChartJS, ChartDataset, Legend, LinearScale, Tooltip} from "chart.js";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SliderWithButtons from "@components/charts/SliderWithButtons";
import {SentReceivedPoint} from "@models/graphData";
import {useTranslations} from "next-intl";
import DownloadButtons from "@components/charts/DownloadButtons";
import {prepareCountsOverTimeData} from "@services/charts/animations";
import {CHART_BOX_PROPS, CHART_COLORS, CHART_LAYOUT, COMMON_CHART_OPTIONS} from "@components/charts/chartConfig";
import useChartPattern from "@/hooks/useChartPattern";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface AnimatedCountsBarChartProps {
    dataMonthlyPerConversation: Record<string, SentReceivedPoint[]>;
    mode: "text" | "audio";
}

const AnimatedCountsBarChart: React.FC<AnimatedCountsBarChartProps> = ({
    dataMonthlyPerConversation, mode
}) => {
    const CHART_NAME = `intensity-interaction-${mode}-hbarchart`;
    const container_name = `chart-wrapper-${CHART_NAME}`;

    const property = mode === "text" ? "Words" : "Seconds";
    const patternColor = useChartPattern(CHART_COLORS.primaryLight, CHART_COLORS.primary);
    const color = mode === "text" ? CHART_COLORS.primary : patternColor;
    const labelTexts = useTranslations("feedback.chartLabels");
    const chartTexts = useTranslations(`feedback.interactionIntensity.animated${property}PerChatBarChart`);

    const chartRef = useRef<any>(null);
    const [cumulativeCounts, setCumulativeCounts] = useState<Record<string, number[]>>({});
    const [labels, setLabels] = useState<string[]>([]);
    const [globalMax, setGlobalMax] = useState<number>(0);
    const [currentFrame, setCurrentFrame] = useState<number>(0);

    useEffect(() => {
        const {
            counts,
            sortedMonths,
            globalMax
        } = prepareCountsOverTimeData(dataMonthlyPerConversation, true);
        setCumulativeCounts(counts);
        setLabels(sortedMonths);
        setGlobalMax(globalMax);
    }, [dataMonthlyPerConversation]);

    const generateChartData = (frameIndex: number) => {
        const monthKey = labels[frameIndex];
        return {
            labels: Object.keys(dataMonthlyPerConversation),
            datasets: [
                {
                    label: chartTexts("legend"),
                    data: cumulativeCounts[monthKey] || [],
                    backgroundColor: color,
                    barThickness: CHART_LAYOUT.hBarThickness,
                },
            ] as ChartDataset<"bar", number[]>[],
        };
    };

    return (
        <Box sx={CHART_BOX_PROPS.main}>
            <Box id={container_name} position="relative" px={CHART_LAYOUT.paddingX} py={CHART_LAYOUT.paddingY}>

                {/* Year/Month Label + Download Buttons */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" align="right" fontWeight="bold" mt={1}
                                sx={{fontSize: CHART_LAYOUT.labelFontSize}}>
                        {labelTexts("yearMonth")} {labels[currentFrame]}
                    </Typography>
                    <DownloadButtons
                        chartId={container_name}
                        fileNamePrefix={CHART_NAME}
                        currentLabel={labels[currentFrame]}
                    />
                </Box>

                {/* Bar Chart */}
                <Box sx={{
                    width: "100%",
                    height: CHART_LAYOUT.responsiveChartHeight,
                    minHeight: CHART_LAYOUT.mobileChartHeight
                }}>
                    <Bar
                        ref={chartRef}
                        data={generateChartData(currentFrame)}
                        options={{
                            ...COMMON_CHART_OPTIONS,
                            indexAxis: "y",
                            scales: {
                                x: {
                                    ...COMMON_CHART_OPTIONS.scales.x,
                                    title: {display: true, text: chartTexts("xAxis")},
                                    max: globalMax,
                                },
                                y: {
                                    ...COMMON_CHART_OPTIONS.scales.y,
                                    grid: {drawOnChartArea: false}
                                }
                            },
                        }}
                    />
                </Box>
            </Box>

            <SliderWithButtons
                value={currentFrame}
                marks={labels.map((label, index) => ({value: index, label}))}
                setCurrentFrame={setCurrentFrame}
            />
        </Box>
    );
};

export default AnimatedCountsBarChart;
