import {Conversation, DataSourceValue} from "@models/processed";
import {DailySentReceivedPoint, GraphData} from "@models/graphData";
import {
    aggregateDailyCounts,
    monthlyCountsPerConversation,
    produceAllDays,
    produceAnswerTimesPerConversation,
    produceDailyCountsPerConversation, produceMessagesSentReceivedPerType,
    produceMonthlySentReceived,
    produceSlidingWindowMean,
    produceWordCountDailyHours
} from "@services/charts/timeAggregates";
import produceBasicStatistics from "@services/charts/produceBasicStatistics";
import {calculateMinMaxDates} from "@services/rangeFiltering";

export default function produceGraphData(donorId: string, allConversations: Conversation[]): Record<string, GraphData> {
    return Object.fromEntries(
        Map.groupBy(allConversations, ({ dataSource }) => dataSource)
            .entries()
            .map(([dataSourceValue, conversations]) => {
                // Extract focus conversations
                const focusConversations = conversations
                    .filter((conversation) => conversation.focusInFeedback)
                    .map((conversation) => conversation.conversationPseudonym);

                // Per conversation data
                const dailyWordsPerConversation = conversations.map((conversation) =>
                    produceDailyCountsPerConversation(donorId, conversation, "words")
                );
                const dailySecondsPerConversation = conversations.map((conversation) =>
                    produceDailyCountsPerConversation(donorId, conversation, "seconds")
                );
                const participantsPerConversation = conversations.map((conversation) =>
                    conversation.participants.filter((participant) => participant !== donorId)
                );
                const monthlyWordsPerConversation = monthlyCountsPerConversation(donorId, conversations, "words");
                const monthlySecondsPerConversation = monthlyCountsPerConversation(donorId, conversations, "seconds");

                // Aggregated conversations data
                const dailyWords = aggregateDailyCounts(dailyWordsPerConversation);
                const dailySeconds = aggregateDailyCounts(dailySecondsPerConversation);

                // Determine the global date range using calculateMinMaxDates
                const { minDate, maxDate } = calculateMinMaxDates(conversations, true);
                let slidingWindowMeanDailyWords: DailySentReceivedPoint[] = [];
                let slidingWindowMeanDailySeconds: DailySentReceivedPoint[] = [];
                if (minDate && maxDate) {
                    // Generate the complete list of all days within the global date range
                    const completeDaysList = produceAllDays(minDate, maxDate);
                    // Create sliding window mean using the complete days list
                    slidingWindowMeanDailyWords = produceSlidingWindowMean(dailyWords, completeDaysList);
                    slidingWindowMeanDailySeconds = produceSlidingWindowMean(dailySeconds, completeDaysList);
                }
                const dailySentHours = produceWordCountDailyHours(donorId, conversations, true);
                const dailyReceivedHours = produceWordCountDailyHours(donorId, conversations, false);

                const answerTimes = conversations.flatMap((conversation) =>
                    produceAnswerTimesPerConversation(donorId, conversation)
                );

                // General statistics
                const messageCounts = produceMessagesSentReceivedPerType(donorId, conversations);
                const wordCounts = Object.values(monthlyWordsPerConversation).flat();
                const secondCounts = Object.values(monthlySecondsPerConversation).flat();

                // Initialize audio length distribution
                let audioLengthDistribution: { sent: Record<string, number>, received: Record<string, number> }  = {
                    sent: {},
                    received: {}
                };

                // Only calculate if there are audio messages
                const hasAudioMessages = conversations.some(conversation => conversation.messagesAudio.length > 0);
                if (hasAudioMessages) {
                    conversations.forEach(conversation => {
                        conversation.messagesAudio.forEach(messageAudio => {
                            if (messageAudio.lengthSeconds > 0) {
                                // Round the length to the nearest second
                                const roundedLength = Math.round(messageAudio.lengthSeconds).toString();

                                if (messageAudio.sender === donorId) {
                                    audioLengthDistribution!.sent[roundedLength] = (audioLengthDistribution!.sent[roundedLength] || 0) + 1;
                                } else {
                                    audioLengthDistribution!.received[roundedLength] = (audioLengthDistribution!.received[roundedLength] || 0) + 1;
                                }
                            }
                        });
                    });
                }

                const basicStatistics = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

                const graphData: GraphData = {
                    focusConversations,
                    monthlyWordsPerConversation,
                    monthlySecondsPerConversation,
                    dailyWords,
                    slidingWindowMeanDailyWords,
                    slidingWindowMeanDailySeconds,
                    dailyWordsPerConversation,
                    dailySentHours,
                    dailyReceivedHours,
                    answerTimes,
                    basicStatistics,
                    participantsPerConversation,
                    audioLengthDistribution
                };

                return [
                    dataSourceValue,
                    graphData,
                ];
            })
    ) as Record<DataSourceValue, GraphData>;
}
