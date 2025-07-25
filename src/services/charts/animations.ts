interface CountsOverTimeData {
    counts: Record<string, number[]>;
    sortedMonths: string[];
    globalMax: number;
}

interface SentReceivedPoint {
    year: number;
    month: number;
    wordCount?: number;
    sentCount?: number;
    receivedCount?: number;
}

/**
 * Prepares cumulative counts over time for conversations based on the provided mode.
 *
 * @param dataMonthlyPerConversation - Monthly sent/received/word data for each conversation.
 * @param sentOnly - If true, only sent counts are considered; otherwise, both sent and received counts are used.
 * @returns An object containing counts per month, sorted month keys, and the global maximum count.
 */
export const prepareCountsOverTimeData = (
    dataMonthlyPerConversation: Record<string, SentReceivedPoint[]>,
    sentOnly: boolean = false
): CountsOverTimeData => {
    const counts: Record<string, number[]> = {};
    const monthsSet = new Set<string>();
    let globalMax = 0;

    const numConversations = Object.keys(dataMonthlyPerConversation).length;
    Object.entries(dataMonthlyPerConversation).forEach(([_, conversationData], convIdx) => {
        let cumulativeSum = 0;
        conversationData
            .sort((a, b) => a.year - b.year || a.month - b.month)
            .forEach((dataPoint) => {
                const monthKey = `${dataPoint.year}-${dataPoint.month.toString().padStart(2, "0")}`;
                monthsSet.add(monthKey);

                if (!counts[monthKey]) counts[monthKey] = Array(numConversations).fill(0);

                const value = (dataPoint.sentCount || 0) + (sentOnly ? 0 : (dataPoint.receivedCount || 0));
                cumulativeSum += value;
                counts[monthKey][convIdx] = cumulativeSum;

                if (cumulativeSum > globalMax) globalMax = cumulativeSum;
            });
    });

    const sortedMonths = Array.from(monthsSet).sort();
    fillMissingMonths(counts, sortedMonths, numConversations);

    return { counts, sortedMonths, globalMax };
};


const fillMissingMonths = (counts: Record<string, number[]>, sortedMonths: string[], numConversations: number) => {
    let lastValues = Array(numConversations).fill(0);
    sortedMonths.forEach((monthKey) => {
        if (!counts[monthKey]) counts[monthKey] = Array(numConversations).fill(0);
        counts[monthKey] = counts[monthKey].map((value, idx) => value || lastValues[idx]);
        lastValues = counts[monthKey];
    });
};