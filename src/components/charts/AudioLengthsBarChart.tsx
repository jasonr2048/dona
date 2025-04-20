import React from "react";
import {Bar} from "react-chartjs-2";
import Box from "@mui/material/Box";
import {useTranslations} from "next-intl";
import DownloadButtons from "@components/charts/DownloadButtons";
import {ChartDataset} from "chart.js";
import {BARCHART_OPTIONS, CHART_COLORS, CHART_LAYOUT, PCT_TOOLTIP, TOP_LEGEND} from "@components/charts/chartConfig";
import {AudioLengthDistribution} from "@models/graphData";

const FIRST = "< 10 sec";
const SECOND = "10-30 sec";
const THIRD = "30-60 sec";
const FOURTH = "1-2 min";
const FIFTH = "2-5 min";
const SIXTH = "> 5 min";

const ranges = [
    { max: 10, label: FIRST },
    { max: 30, label: SECOND },
    { max: 60, label: THIRD },
    { max: 120, label: FOURTH },
    { max: 300, label: FIFTH },
    { max: Infinity, label: SIXTH },
];

interface AudioLengthsBarChartProps {
    audioLengthDistribution: AudioLengthDistribution;
}

const AudioLengthsBarChart: React.FC<AudioLengthsBarChartProps> = ({ audioLengthDistribution }) => {
    const CHART_NAME = "audio-lengths-barchart";
    const container_name = `chart-wrapper-${CHART_NAME}`;

    const chartTexts = useTranslations("feedback.messageComposition.audioLengthsBarChart");

    // Initialize counts for each range
    const binnedDistribution = {
        sent: Object.fromEntries(ranges.map(range => [range.label, 0])),
        received: Object.fromEntries(ranges.map(range => [range.label, 0]))
    };

    // Bin the audio lengths into the predefined ranges
    Object.entries(audioLengthDistribution.sent).forEach(([length, count]) => {
        const seconds = parseInt(length, 10);
        for (const range of ranges) {
            if (seconds < range.max) {
                binnedDistribution.sent[range.label] += count;
                break;
            }
        }
    });

    Object.entries(audioLengthDistribution.received).forEach(([length, count]) => {
        const seconds = parseInt(length, 10);
        for (const range of ranges) {
            if (seconds < range.max) {
                binnedDistribution.received[range.label] += count;
                break;
            }
        }
    });

    // Get the counts for donor and contact audio messages from the binned dictionary
    const donorCounts = ranges.map(range => binnedDistribution.sent[range.label]);
    const contactCounts = ranges.map(range => binnedDistribution.received[range.label]);

    // Get the total number of messages for percentage calculation
    const donorTotalAudioMessages = Object.values(binnedDistribution.sent).reduce((sum, count) => sum + count, 0);
    const contactTotalAudioMessages = Object.values(binnedDistribution.received).reduce((sum, count) => sum + count, 0);

    // Calculate percentages for each range
    const donorPercentages = donorCounts.map((count) => (donorTotalAudioMessages > 0 ? (count / donorTotalAudioMessages) * 100 : 0));
    const contactPercentages = contactCounts.map((count) => (contactTotalAudioMessages > 0 ? (count / contactTotalAudioMessages) * 100 : 0));

    // Create datasets for the chart
    const datasets: ChartDataset<"bar", number[]>[] = [
        {
            label: chartTexts("legend.contacts"),
            data: contactPercentages,
            backgroundColor: CHART_COLORS.secondaryBar,
            barPercentage: CHART_LAYOUT.barPercentageNarrow,
        },
        {
            label: chartTexts("legend.donor"),
            data: donorPercentages,
            backgroundColor: CHART_COLORS.primaryBar,
            barPercentage: CHART_LAYOUT.barPercentageWide,
        },
    ].filter(Boolean) as ChartDataset<"bar", number[]>[];

    const data = {
        labels: ranges.map((range) => range.label),
        datasets: datasets
    };

    const options = {
        ...BARCHART_OPTIONS,
        plugins: {
            legend: TOP_LEGEND,
            tooltip: PCT_TOOLTIP,
        },
        scales: {
            x: {
                ...BARCHART_OPTIONS.scales.x,
                title: { display: true, text: chartTexts("xAxis") },
                stacked: true,
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

export default AudioLengthsBarChart;
