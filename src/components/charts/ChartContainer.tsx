import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {GraphData} from "@models/graphData";
import pick from "@services/basicHelpers";
import ResponseTimeBarChart from "@components/charts/ResponseTimeBarChart";
import AnimatedCountsPerChatBarChart from "@components/charts/AnimatedCountsPerChatBarChart";
import AnimatedDayPartsActivityChart from "@components/charts/AnimatedDayPartsActivityChart";
import AnimatedIntensityPolarChart from "@components/charts/AnimatedIntensityPolarChart";
import AnimatedResponseTimeBarChart from "@components/charts/AnimatedResponseTimeBarChart";
import DailyActivityChart from "@components/charts/DailyActivityChart";
import DayPartsActivityOverallChart from "@components/charts/DayPartsActivityOverallChart";
import SentReceivedSlidingWindowChart from "@components/charts/SentReceivedSlidingWindowChart";
import CountsOverallBarChart from "@components/charts/CountsOverallBarChart";
import MessageTypesBarChart from "@components/charts/MessageTypesBarChart";
import AudioLengthsBarChart from "@components/charts/AudioLengthsBarChart";
import EmojiBarChart from "@components/charts/EmojiBarChart";

export enum ChartType {
    MessageTypesBarChart = "messageTypesBarChart",
    AudioLengthsBarChart = "audioLengthsBarChart",
    EmojiBarChart = "emojiBarChart",
    AnimatedIntensityPolarChart = "animatedIntensityPolarChart",
    AnimatedWordsPerChatBarChart = "animatedWordsPerChatBarChart",
    AnimatedSecondsPerChatBarChart = "animatedSecondsPerChatBarChart",
    WordCountOverallBarChart = "wordCountOverallBarChart",
    SecondCountOverallBarChart = "secondCountOverallBarChart",
    WordCountSlidingWindowMean = "wordCountSlidingWindowMean",
    SecondCountSlidingWindowMean = "secondCountSlidingWindowMean",
    ResponseTimeBarChart = "responseTimeBarChart",
    AnimatedResponseTimeBarChart = "animatedResponseTimeBarChart",
    DailyActivityHoursChart = "dailyActivityHoursChart",
    DayPartsActivityOverallChart = "dayPartsActivityOverallChart",
    AnimatedDayPartsActivityChart = "animatedDayPartsActivityChart",
}

interface ChartContainerProps {
    type: ChartType;
    data: GraphData;
    dataSourceValue?: string;
}

export default function ChartContainer({ type, data }: ChartContainerProps) {
    // For charts that show data per conversation, keep only the ones selected by the user
    const selectedChatsWordsData = pick(data.monthlyWordsPerConversation, data.focusConversations);
    const selectedChatsSecondsData = pick(data.monthlySecondsPerConversation, data.focusConversations);

    const renderChart = () => {
        switch (type) {

            // Focus conversations only
            case ChartType.AnimatedIntensityPolarChart:
                return <AnimatedIntensityPolarChart dataMonthlyPerConversation={selectedChatsWordsData}/>;
            case ChartType.AnimatedWordsPerChatBarChart:
                return <AnimatedCountsPerChatBarChart dataMonthlyPerConversation={selectedChatsWordsData} mode="text"/>;
            case ChartType.AnimatedSecondsPerChatBarChart:
                return <AnimatedCountsPerChatBarChart dataMonthlyPerConversation={selectedChatsSecondsData} mode="audio"/>;

            // Message composition
            case ChartType.MessageTypesBarChart:
                return (
                    <MessageTypesBarChart
                        basicStatistics={data.basicStatistics}
                    />
                );
            case ChartType.AudioLengthsBarChart:
                return (
                    <AudioLengthsBarChart
                        audioLengthDistribution={data.audioLengthDistribution}
                    />
                );
            case ChartType.EmojiBarChart:
                return data.emojiDistribution ? (
                    <EmojiBarChart
                        emojiDistribution={data.emojiDistribution}
                    />
                ) : null;

            // Aggregated data only
            case ChartType.WordCountOverallBarChart:
                return (
                    <CountsOverallBarChart
                        sentWordsTotal={data.basicStatistics.wordsTotal.sent}
                        receivedWordsTotal={data.basicStatistics.wordsTotal.received}
                        mode="text"
                    />
                );
            case ChartType.SecondCountOverallBarChart:
                return (
                    <CountsOverallBarChart
                        sentWordsTotal={data.basicStatistics.secondsTotal.sent}
                        receivedWordsTotal={data.basicStatistics.secondsTotal.received}
                        mode="audio"
                    />
                );
            case ChartType.WordCountSlidingWindowMean:
                return (
                    <SentReceivedSlidingWindowChart
                        slidingWindowMeanDailyWords={data.slidingWindowMeanDailyWords} mode="text"
                    />
                );
            case ChartType.SecondCountSlidingWindowMean:
                return (
                    <SentReceivedSlidingWindowChart
                        slidingWindowMeanDailyWords={data.slidingWindowMeanDailySeconds} mode="audio"
                    />
                );

            // Response times
            case ChartType.ResponseTimeBarChart:
                return <ResponseTimeBarChart responseTimes={data.answerTimes}/>;
            case ChartType.AnimatedResponseTimeBarChart:
                return <AnimatedResponseTimeBarChart answerTimes={data.answerTimes}/>;

            // Daily activity times
            case ChartType.DailyActivityHoursChart:
                return <DailyActivityChart dataSentPerConversation={data.dailySentHoursPerConversation} listOfConversations={data.focusConversations} />;
            case ChartType.DayPartsActivityOverallChart:
                return (
                    <DayPartsActivityOverallChart
                        dailySentHours={data.dailySentHours}
                        dailyReceivedHours={data.dailyReceivedHours}
                    />
                );
            case ChartType.AnimatedDayPartsActivityChart:
                return <AnimatedDayPartsActivityChart dataSentPerConversation={data.dailySentHoursPerConversation} listOfConversations={data.focusConversations} />;

            default:
                return (
                    <Box
                        sx={{
                            width: '100%',
                            border: '1px dashed grey',
                            height: 150,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="body2">Placeholder for {type} chart</Typography>
                    </Box>
                );
        }
    };

    return renderChart();
}
