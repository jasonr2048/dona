import React, {useEffect, useMemo, useState} from "react";
import {Bar} from "react-chartjs-2";
import {BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip} from "chart.js";
import SliderWithButtons from "@components/charts/SliderWithButtons";
import DownloadButtons from "@components/charts/DownloadButtons";
import {useTranslations} from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {DailyHourPoint} from "@models/graphData";
import {CHART_BOX_PROPS, CHART_COLORS, CHART_LAYOUT, BARCHART_OPTIONS} from "@components/charts/chartConfig";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ALL_CHATS = "ALL_CHATS";

interface AnimatedDayPartsActivityChartProps {
    dataSentPerConversation: DailyHourPoint[][];
    listOfConversations: string[];
}

const AnimatedDayPartsActivityChart: React.FC<AnimatedDayPartsActivityChartProps> = ({ dataSentPerConversation, listOfConversations }) => {
    const CHART_NAME = "day-parts-activity-barchart";
    const container_name = `chart-wrapper-${CHART_NAME}`;
    const selection_label_name = `select-label-${CHART_NAME}`;

    const chartTexts = useTranslations("feedback.dailyActivityTimes.dayPartsMonthly");
    const labelTexts = useTranslations("feedback.chartLabels");
    const [selectedConversation, setSelectedConversation] = useState<string>(ALL_CHATS);

    const buckets = ["00:00-05:59", "06:00-11:59", "12:00-17:59", "18:00-23:59"];
    const [currentFrame, setCurrentFrame] = useState<number>(0);
    const [preparedData, setPreparedData] = useState<Record<string, number[]> | null>(null);
    const [labels, setLabels] = useState<string[]>([]);

    const preprocessData = (data: DailyHourPoint[]) => {
        const groupedByMonth: Record<string, number[]> = {};
        const monthsSet = new Set<string>();

        data.forEach(({ year, month, hour, wordCount }) => {
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
        const flat: DailyHourPoint[] = dataSentPerConversation.flat();
        const { counts, sortedMonths } = preprocessData(flat);
        setPreparedData(counts);
        setLabels(sortedMonths);
    }, [dataSentPerConversation]);

    // Build the current view (counts + labels) based on selection
    const currentView = useMemo(() => {
        if (selectedConversation === ALL_CHATS) {
            return { counts: preparedData || {}, sortedMonths: labels } as { counts: Record<string, number[]>; sortedMonths: string[] };
        }
        const conversationIndex = listOfConversations.indexOf(selectedConversation);
        const selectedArray = dataSentPerConversation[conversationIndex] || [];
        return preprocessData(selectedArray);
    }, [preparedData, labels, selectedConversation, dataSentPerConversation, listOfConversations]);

    // Reset or clamp frame when selection/labels change
    useEffect(() => {
        if (currentView.sortedMonths.length === 0) {
            setCurrentFrame(0);
        } else if (currentFrame >= currentView.sortedMonths.length) {
            setCurrentFrame(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversation, currentView.sortedMonths.length]);

    const generateChartData = (frameIndex: number) => {
        const monthKey = currentView.sortedMonths[frameIndex];
        return {
            labels: buckets,
            datasets: [
                {
                    label: chartTexts("legend.sent"),
                    data: (currentView.counts && monthKey) ? (currentView.counts[monthKey] || []) : [],
                    backgroundColor: CHART_COLORS.primary,
                    barThickness: CHART_LAYOUT.hBarThickness,
                },
            ],
        };
    };

    return (
        <Box sx={CHART_BOX_PROPS.main}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Select
                    value={selectedConversation}
                    onChange={(e) => setSelectedConversation(e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", mb: -1, pb: 0, fontSize: CHART_LAYOUT.labelFontSize }}
                >
                    <MenuItem value={ALL_CHATS} sx={{ fontSize: CHART_LAYOUT.labelFontSize }}>{labelTexts("overallData")}</MenuItem>
                    {listOfConversations.map((conversation) => (
                        <MenuItem sx={{ fontSize: CHART_LAYOUT.labelFontSize }} key={conversation} value={conversation}>
                            {conversation}
                        </MenuItem>
                    ))}
                </Select>

                <Box id={container_name} position="relative" px={CHART_LAYOUT.paddingX} py={CHART_LAYOUT.paddingY}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography id={selection_label_name} variant="body2" align="right" fontWeight="bold" mt={1} sx={{ fontSize: CHART_LAYOUT.labelFontSize }}>
                        {labelTexts("yearMonth")} {currentView.sortedMonths[currentFrame]}
                    </Typography>
                    <DownloadButtons
                        chartId={container_name}
                        fileNamePrefix={`${CHART_NAME}-${selectedConversation}`}
                        currentLabel={currentView.sortedMonths[currentFrame]}
                    />
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
                    marks={currentView.sortedMonths.map((label, index) => ({ value: index, label }))}
                    setCurrentFrame={setCurrentFrame}
                />
            </Box>
        </Box>
    );
};

export default AnimatedDayPartsActivityChart;
