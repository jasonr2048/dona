import React from "react";
import {Bar} from "react-chartjs-2";
import Box from "@mui/material/Box";
import {useTranslations} from "next-intl";
import DownloadButtons from "@components/charts/DownloadButtons";
import {BARCHART_OPTIONS, CHART_COLORS, CHART_LAYOUT, TOP_LEGEND} from "@components/charts/chartConfig";
import {EmojiDistribution} from "@models/graphData";
import useChartPattern from "@/hooks/useChartPattern";
import {ChartDataset} from "chart.js";
import Typography from "@mui/material/Typography";

interface EmojiBarChartProps {
    emojiDistribution: EmojiDistribution;
}

const EmojiBarChart: React.FC<EmojiBarChartProps> = ({ emojiDistribution }) => {
    const CHART_NAME = "emoji-barchart";
    const container_name = `chart-wrapper-${CHART_NAME}`;
    const chartTexts = useTranslations("feedback.messageComposition.emojiBarChart");
    const primaryPattern = useChartPattern(CHART_COLORS.primaryLight, CHART_COLORS.primary);
    const secondaryPattern = useChartPattern(CHART_COLORS.secondaryLight, CHART_COLORS.secondary);

    // Combine and sort emojis by total usage
    const allEmojis = new Set([
        ...Object.keys(emojiDistribution.sent),
        ...Object.keys(emojiDistribution.received)
    ]);

    // Calculate total usage for each emoji and sort
    const emojiTotals = Array.from(allEmojis).map(emoji => ({
        emoji,
        total: (emojiDistribution.sent[emoji] || 0) + (emojiDistribution.received[emoji] || 0)
    })).sort((a, b) => b.total - a.total);

    // Get top 20 emojis
    const topEmojis = emojiTotals.slice(0, 20);

    // Check if there's any data
    if (topEmojis.length === 0) {
        return (
            <Box id={container_name} position="relative" p={CHART_LAYOUT.paddingX}>
                <Typography variant="body1" align="center" color="text.secondary">
                    {chartTexts("noData")}
                </Typography>
            </Box>
        );
    }

    // Prepare data for the chart
    const labels = topEmojis.map(item => item.emoji);
    const donorCounts = topEmojis.map(item => emojiDistribution.sent[item.emoji] || 0);
    const contactCounts = topEmojis.map(item => emojiDistribution.received[item.emoji] || 0);

    // Create datasets for the chart
    const datasets = [
        {
            label: chartTexts("legend.contacts"),
            data: contactCounts,
            backgroundColor: secondaryPattern,
            barPercentage: CHART_LAYOUT.barPercentageNarrow,
        },
        {
            label: chartTexts("legend.donor"),
            data: donorCounts,
            backgroundColor: primaryPattern,
            barPercentage: CHART_LAYOUT.barPercentageWide,
        },
    ] as ChartDataset<"bar", number[]>[];

    const data = {
        labels,
        datasets
    };

    const options = {
        ...BARCHART_OPTIONS,
        plugins: {
            legend: TOP_LEGEND,
            tooltip: {
                ...BARCHART_OPTIONS.plugins.tooltip,
                callbacks: {
                    title: function(context: any) {
                        // Display the emoji in the tooltip title
                        return context[0].label;
                    },
                    label: function(context: any) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value}`;
                    }
                }
            },
        },
        scales: {
            x: {
                ...BARCHART_OPTIONS.scales.x,
                title: { display: true, text: chartTexts("xAxis") },
                ticks: {
                    font: {
                        size: 16  // Make emojis larger in the axis
                    }
                }
            },
            y: {
                ...BARCHART_OPTIONS.scales.y,
                title: { display: true, text: chartTexts("yAxis") }
            },
        },
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

export default EmojiBarChart;
