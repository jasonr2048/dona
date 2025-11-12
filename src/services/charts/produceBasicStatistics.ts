import {BasicStatistics, MessageCounts, SentReceived, SentReceivedPoint} from "@models/graphData";

const produceBasicStatistics = (
    messageCounts: MessageCounts, 
    wordCounts: SentReceivedPoint[], 
    secondCounts: SentReceivedPoint[],
    emojiTotals?: SentReceived
): BasicStatistics => {
    // Totals
    const calculateTotal = (data: SentReceivedPoint[], key: keyof SentReceivedPoint): number =>
        data.map((point) => point[key]).reduce((a, b) => a + b, 0);

    const calculateActiveMonthAverage = (totalCount: number, numMonths: number): number =>
        numMonths > 0 ? Math.round(totalCount / numMonths) : 0;

    const sentWordsTotal = calculateTotal(wordCounts, "sentCount");
    const receivedWordsTotal = calculateTotal(wordCounts, "receivedCount");
    const sentSecondsTotal = calculateTotal(secondCounts, "sentCount");
    const receivedSecondsTotal = calculateTotal(secondCounts, "receivedCount");

    // Averages
    const activeMonths = new Set([...wordCounts, ...secondCounts].map((point) => `${point.year}-${point.month}`)).size;
    const activeYears = new Set([...wordCounts, ...secondCounts].map((point) => point.year)).size;

    const sentPerActiveMonth = activeMonths > 0 ? Math.round(messageCounts.allMessages.sent / activeMonths) : 0;
    const receivedPerActiveMonth = activeMonths > 0 ? Math.round(messageCounts.allMessages.received / activeMonths) : 0;

    return {
        messagesTotal: messageCounts,
        wordsTotal: {sent: sentWordsTotal, received: receivedWordsTotal},
        secondsTotal: {sent: sentSecondsTotal, received: receivedSecondsTotal},
        emojisTotal: emojiTotals,

        numberOfActiveMonths: activeMonths,
        numberOfActiveYears: activeYears,

        messagesPerActiveMonth: {
            textMessages: {
                sent: calculateActiveMonthAverage(messageCounts.textMessages.sent, activeMonths),
                received: calculateActiveMonthAverage(messageCounts.textMessages.received, activeMonths),
            },
            audioMessages: {
                sent: calculateActiveMonthAverage(messageCounts.audioMessages.sent, activeMonths),
                received: calculateActiveMonthAverage(messageCounts.audioMessages.received, activeMonths),
            },
            allMessages: {
                sent: sentPerActiveMonth,
                received: receivedPerActiveMonth,
            },
        },
        wordsPerActiveMonth: {
            sent: calculateActiveMonthAverage(sentWordsTotal, activeMonths),
            received: calculateActiveMonthAverage(receivedWordsTotal, activeMonths)
        },
        secondsPerActiveMonth: {
            sent: calculateActiveMonthAverage(sentSecondsTotal, activeMonths),
            received: calculateActiveMonthAverage(receivedSecondsTotal, activeMonths)
        }
    };
}

export default produceBasicStatistics;
