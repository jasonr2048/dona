import produceGraphData from "@services/charts/produceGraphData";
import {beforeAll, describe, expect, it} from "@jest/globals";
import {createConversation} from "./testHelpers";
import {GraphData} from "@models/graphData";
import {getEpochSeconds} from "@services/charts/timeAggregates";

describe("produceGraphData", () => {
    const donorId = "donor";

    const testCases = [
        {
            name: "Single conversation with text messages only",
            socialData: {
                donorId,
                conversations: [
                    createConversation("Facebook", [
                        [2023, 12, 1, donorId],
                        [2023, 12, 2, "participant1"],
                        [2023, 12, 3, donorId],
                    ], [], true, "conversation-0"),
                ],
            },
            expectedGraph: {
                Facebook: {
                    monthlyWordsPerConversation: {
                        "conversation-0": [
                            { year: 2023, month: 12, sentCount: 30, receivedCount: 15 },
                        ],
                    },
                    dailyWords: [
                        { year: 2023, month: 12, date: 1, sentCount: 15, receivedCount: 0, epochSeconds: getEpochSeconds(2023, 12, 1) },
                        { year: 2023, month: 12, date: 2, sentCount: 0, receivedCount: 15, epochSeconds: getEpochSeconds(2023, 12, 2) },
                        { year: 2023, month: 12, date: 3, sentCount: 15, receivedCount: 0, epochSeconds: getEpochSeconds(2023, 12, 3) },
                    ],
                    slidingWindowMeanDailyWords: [
                        { year: 2023, month: 12, date: 1, sentCount: 10, receivedCount: 5, epochSeconds: getEpochSeconds(2023, 12, 1) },
                        { year: 2023, month: 12, date: 2, sentCount: 10, receivedCount: 5, epochSeconds: getEpochSeconds(2023, 12, 2) },
                        { year: 2023, month: 12, date: 3, sentCount: 10, receivedCount: 5, epochSeconds: getEpochSeconds(2023, 12, 3) },
                    ],
                    basicStatistics: {
                        messagesTotal: {
                            textMessages: { sent: 2, received: 1 },
                            audioMessages: { sent: 0, received: 0 },
                            allMessages: { sent: 2, received: 1 }
                        },
                        wordsTotal: { sent: 30, received: 15 },
                        secondsTotal: { sent: 0, received: 0 },
                        numberOfActiveMonths: 1,
                        numberOfActiveYears: 1,
                        messagesPerActiveMonth: {
                            textMessages: { sent: 2, received: 1 },
                            audioMessages: { sent: 0, received: 0 },
                            allMessages: { sent: 2, received: 1 }
                        },
                        wordsPerActiveMonth: { sent: 30, received: 15 },
                        secondsPerActiveMonth: { sent: 0, received: 0 }
                    },
                    participantsPerConversation: [["participant1"]],
                },
            },
        },
        {
            name: "Group conversation with audio messages",
            socialData: {
                donorId,
                conversations: [
                    createConversation(
                        "WhatsApp",
                        [
                            [2023, 11, 30, donorId],
                            [2023, 12, 1, "participant1"],
                        ],
                        [
                            [2023, 12, 2, "participant2", 30], // Audio message => ignored for words, but included for message counts
                        ],
                        true,
                        "conversation-0"
                    ),
                ],
            },
            expectedGraph: {
                WhatsApp: {
                    monthlyWordsPerConversation: {
                        "conversation-0": [
                            { year: 2023, month: 11, sentCount: 15, receivedCount: 0 },
                            { year: 2023, month: 12, sentCount: 0, receivedCount: 15 },
                        ],
                    },
                    dailyWords: [
                        { year: 2023, month: 11, date: 30, sentCount: 15, receivedCount: 0, epochSeconds: getEpochSeconds(2023, 11, 30) },
                        { year: 2023, month: 12, date: 1, sentCount: 0, receivedCount: 15, epochSeconds: getEpochSeconds(2023, 12, 1) },
                    ],
                    slidingWindowMeanDailyWords: [
                        { year: 2023, month: 11, date: 30, sentCount: 8, receivedCount: 8, epochSeconds: getEpochSeconds(2023, 11, 30) },
                        { year: 2023, month: 12, date: 1, sentCount: 8, receivedCount: 8, epochSeconds: getEpochSeconds(2023, 12, 1) },
                    ],
                    basicStatistics: {
                        messagesTotal: {
                            textMessages: { sent: 1, received: 1 },
                            audioMessages: { sent: 0, received: 1 },
                            allMessages: { sent: 1, received: 2 }
                        },
                        wordsTotal: { sent: 15, received: 15 },
                        secondsTotal: { sent: 0, received: 30 },
                        numberOfActiveMonths: 2,
                        numberOfActiveYears: 1,
                        messagesPerActiveMonth: {
                            textMessages: { sent: 1, received: 1 },  // sent = (1+0)/2, received = (0+1)/2
                            audioMessages: { sent: 0, received: 1 },  // sent = (0+0)/2, received = (0+1)/2
                            allMessages: { sent: 1, received: 1 }  // sent = (1+0)/2, received = (1+1)/2
                        },
                        wordsPerActiveMonth: { sent: 8, received: 8 },  // sent = (15+0)/2, received = (0+15)/2
                        secondsPerActiveMonth: { sent: 0, received: 15 }  // sent = (0+0)/2, received = (0+30)/2
                    },
                    participantsPerConversation: [["participant1", "participant2"]],
                },
            },
        },
        {
            name: "Conversation not marked as focus in feedback",
            socialData: {
                donorId,
                conversations: [
                    createConversation("Facebook", [
                        [2023, 12, 1, donorId],
                        [2023, 12, 2, "participant1"],
                        [2023, 12, 3, donorId],
                    ], [], false, "conversation-0"),
                ],
            },
            expectedGraph: {
                Facebook: {
                    focusConversations: [],
                    monthlyWordsPerConversation: {
                        "conversation-0": [
                            { year: 2023, month: 12, sentCount: 30, receivedCount: 15 },
                        ],
                    },
                    dailyWords: [
                        { year: 2023, month: 12, date: 1, sentCount: 15, receivedCount: 0, epochSeconds: getEpochSeconds(2023, 12, 1) },
                        { year: 2023, month: 12, date: 2, sentCount: 0, receivedCount: 15, epochSeconds: getEpochSeconds(2023, 12, 2) },
                        { year: 2023, month: 12, date: 3, sentCount: 15, receivedCount: 0, epochSeconds: getEpochSeconds(2023, 12, 3) },
                    ],
                    slidingWindowMeanDailyWords: [
                        { year: 2023, month: 12, date: 1, sentCount: 10, receivedCount: 5, epochSeconds: getEpochSeconds(2023, 12, 1) },
                        { year: 2023, month: 12, date: 2, sentCount: 10, receivedCount: 5, epochSeconds: getEpochSeconds(2023, 12, 2) },
                        { year: 2023, month: 12, date: 3, sentCount: 10, receivedCount: 5, epochSeconds: getEpochSeconds(2023, 12, 3) },
                    ],
                    basicStatistics: {
                        messagesTotal: {
                            textMessages: { sent: 2, received: 1 },
                            audioMessages: { sent: 0, received: 0 },
                            allMessages: { sent: 2, received: 1 }
                        },
                        wordsTotal: { sent: 30, received: 15 },
                        secondsTotal: { sent: 0, received: 0 },
                        numberOfActiveMonths: 1,
                        numberOfActiveYears: 1,
                        messagesPerActiveMonth: {
                            textMessages: { sent: 2, received: 1 },
                            audioMessages: { sent: 0, received: 0 },
                            allMessages: { sent: 2, received: 1 }
                        },
                        wordsPerActiveMonth: { sent: 30, received: 15 },
                        secondsPerActiveMonth: { sent: 0, received: 0 }
                    },
                    participantsPerConversation: [["participant1"]],
                },
            },
        },
    ];

    testCases.forEach(({ name, socialData, expectedGraph }) => {
        describe(name, () => {
            let result: Record<string, GraphData>;

            beforeAll(() => {
                result = produceGraphData(socialData.donorId, socialData.conversations);
            });

            it("should produce the correct data sources", () => {
                expect(Object.keys(result)).toEqual(Object.keys(expectedGraph));
            });

            Object.entries(expectedGraph).forEach(([key, expectedData]) => {
                it(`should produce the expected graph data for dataSource: ${key}`, () => {
                    expect(result[key].monthlyWordsPerConversation).toEqual(
                        expectedData.monthlyWordsPerConversation
                    );
                    expect(result[key].dailyWords).toEqual(expectedData.dailyWords);
                    expect(result[key].slidingWindowMeanDailyWords).toEqual(
                        expectedData.slidingWindowMeanDailyWords
                    );
                    expect(result[key].basicStatistics).toEqual(expectedData.basicStatistics);
                    expect(result[key].participantsPerConversation).toEqual(expectedData.participantsPerConversation);
                });
            });
        });
    });
});
