import React, {useEffect, useState} from "react";
import {Bar} from "react-chartjs-2";
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip} from "chart.js";
import SliderWithButtons from "@components/charts/SliderWithButtons";
import DownloadButtons from "@components/charts/DownloadButtons";
import {useTranslations} from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {DailyHourPoint} from "@models/graphData";
import {CHART_BOX_PROPS, CHART_COLORS, CHART_LAYOUT, BARCHART_OPTIONS} from "@components/charts/chartConfig";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface AnimatedDayPartsActivityChartProps {
    dailySentHours: DailyHourPoint[];
}

const AnimatedDayPartsActivityChart: React.FC<AnimatedDayPartsActivityChartProps> = ({
                                                                                         dailySentHours,
                                                                                     }) => {
    const CHART_NAME = "day-parts-activity-barchart";
    const container_name = `chart-wrapper-${CHART_NAME}`;

    const chartTexts = useTranslations("feedback.dailyActivityTimes.dayPartsMonthly");
    const labelTexts = useTranslations("feedback.chartLabels");

    const buckets = ["00:00-05:59", "06:00-11:59", "12:00-17:59", "18:00-23:59"];
    const [currentFrame, setCurrentFrame] = useState<number>(0);
    const [preparedData, setPreparedData] = useState<Record<string, number[]> | null>(null);
    const [labels, setLabels] = useState<string[]>([]);

    const preprocessData = () => {
        const groupedByMonth: Record<string, number[]> = {};
        const monthsSet = new Set<string>();

        dailySentHours.forEach(({ year, month, hour, wordCount }) => {
            const bucketIndex = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
            const monthKey = `${year}-${String(month).padStart(2, "0")}`;
            monthsSet.add(monthKey);

            if (!groupedByMonth[monthKey]) {
                groupedByMonth[monthKey] = new Array(buckets.length).fill(0);
            }

            groupedByMonth[monthKey][bucketIndex] += wordCount || 0;
        });

        const sortedMonths = Array.from(monthsSet).sort();
        sortedMonths.forEach((monthKey) => {
            const total = groupedByMonth[monthKey].reduce((a, b) => a + b, 0);
            groupedByMonth[monthKey] = total
                ? groupedByMonth[monthKey].map((count) => (count / total) * 100)
                : new Array(buckets.length).fill(0);
        });

        return { counts: groupedByMonth, sortedMonths };
    };

    useEffect(() => {
        const { counts, sortedMonths } = preprocessData();
        setPreparedData(counts);
        setLabels(sortedMonths);
    }, [dailySentHours]);

    const generateChartData = (frameIndex: number) => {
        const monthKey = labels[frameIndex];
        return {
            labels: buckets,
            datasets: [
                {
                    label: chartTexts("legend.sent"),
                    data: preparedData?.[monthKey] || [],
                    backgroundColor: CHART_COLORS.primary,
                    barThickness: CHART_LAYOUT.hBarThickness,
                },
            ],
        };
    };

    return (
        <Box sx={CHART_BOX_PROPS.main}>
            <Box id={container_name} position="relative" px={CHART_LAYOUT.paddingX} py={CHART_LAYOUT.paddingY}>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" align="right" fontWeight="bold" mt={1} sx={{ fontSize: CHART_LAYOUT.labelFontSize }}>
                        {labelTexts("yearMonth")} {labels[currentFrame]}
                    </Typography>
                    <DownloadButtons chartId={container_name} fileNamePrefix={CHART_NAME} currentLabel={labels[currentFrame]} />
                </Box>

                <Box sx={{
                    width: "100%",
                    height: CHART_LAYOUT.responsiveChartHeight,
                    minHeight: CHART_LAYOUT.mobileChartHeight,
                    ml: -1
                }}>
                    <Bar
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

export default AnimatedDayPartsActivityChart;
