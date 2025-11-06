export type CountOption =  "words" | "seconds";


export interface SentReceivedPoint {
    year: number;
    month: number;
    sentCount: number;
    receivedCount: number;
}

export interface DailySentReceivedPoint {
    year: number;
    month: number;
    date: number;
    sentCount: number;
    receivedCount: number;
    epochSeconds: number;
}

export interface AnswerTimePoint {
    responseTimeMs: number;
    isFromDonor: boolean;
    timestampMs: number;
}

export interface DailyHourPoint {
    year: number;
    month: number;
    date: number;
    hour: number;
    minute: number;
    wordCount: number;
    epochSeconds: number;
}

export type SentReceived = {
    sent: number;
    received: number;
};

export type MessageCounts = {
    textMessages: SentReceived;
    audioMessages: SentReceived;
    allMessages: SentReceived;
}

export interface AudioLengthDistribution {
    sent: Record<string, number>;
    received: Record<string, number>;
}

export interface BasicStatistics {
    messagesTotal: MessageCounts;
    wordsTotal: SentReceived;
    secondsTotal: SentReceived;
    numberOfActiveMonths: number;
    numberOfActiveYears: number;
    messagesPerActiveMonth: MessageCounts;
    wordsPerActiveMonth: SentReceived;
    secondsPerActiveMonth: SentReceived;
}

export interface GraphData {
    focusConversations: string[];
    monthlyWordsPerConversation: Record<string, SentReceivedPoint[]>;
    monthlySecondsPerConversation: Record<string, SentReceivedPoint[]>;
    dailyWordsPerConversation: DailySentReceivedPoint[][];
    participantsPerConversation: string[][];
    dailyWords: DailySentReceivedPoint[];
    slidingWindowMeanDailyWords: DailySentReceivedPoint[];
    slidingWindowMeanDailySeconds: DailySentReceivedPoint[];
    dailySentHours: DailyHourPoint[];
    // New: Sent hours per conversation for DailyActivityChart selection
    dailySentHoursPerConversation: DailyHourPoint[][];
    dailyReceivedHours: DailyHourPoint[];
    answerTimes: AnswerTimePoint[];
    audioLengthDistribution: AudioLengthDistribution;
    basicStatistics: BasicStatistics;
}
