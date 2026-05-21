import { describe, expect, it } from "@jest/globals";
import produceBasicStatistics from "@services/charts/produceBasicStatistics";
import { MessageCounts, SentReceivedPoint } from "@models/graphData";

describe("produceBasicStatistics", () => {
  it("should calculate basic statistics with text messages only", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 100, received: 80 },
      audioMessages: { sent: 0, received: 0 },
      allMessages: { sent: 100, received: 80 }
    };

    const wordCounts: SentReceivedPoint[] = [
      { year: 2023, month: 1, sentCount: 500, receivedCount: 400 },
      { year: 2023, month: 2, sentCount: 300, receivedCount: 200 }
    ];

    const secondCounts: SentReceivedPoint[] = [
      { year: 2023, month: 1, sentCount: 0, receivedCount: 0 },
      { year: 2023, month: 2, sentCount: 0, receivedCount: 0 }
    ];

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

    expect(result.messagesTotal).toEqual(messageCounts);
    expect(result.wordsTotal).toEqual({ sent: 800, received: 600 });
    expect(result.secondsTotal).toEqual({ sent: 0, received: 0 });
    expect(result.numberOfActiveMonths).toBe(2);
    expect(result.numberOfActiveYears).toBe(1);
    expect(result.messagesPerActiveMonth.textMessages).toEqual({ sent: 50, received: 40 });
    expect(result.messagesPerActiveMonth.allMessages).toEqual({ sent: 50, received: 40 });
    expect(result.wordsPerActiveMonth).toEqual({ sent: 400, received: 300 });
    expect(result.secondsPerActiveMonth).toEqual({ sent: 0, received: 0 });
    expect(result.emojisTotal).toBeUndefined();
  });

  it("should calculate statistics with audio messages", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 50, received: 30 },
      audioMessages: { sent: 10, received: 20 },
      allMessages: { sent: 60, received: 50 }
    };

    const wordCounts: SentReceivedPoint[] = [{ year: 2023, month: 3, sentCount: 250, receivedCount: 150 }];

    const secondCounts: SentReceivedPoint[] = [{ year: 2023, month: 3, sentCount: 600, receivedCount: 1200 }];

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

    expect(result.wordsTotal).toEqual({ sent: 250, received: 150 });
    expect(result.secondsTotal).toEqual({ sent: 600, received: 1200 });
    expect(result.numberOfActiveMonths).toBe(1);
    expect(result.messagesPerActiveMonth.audioMessages).toEqual({ sent: 10, received: 20 });
    expect(result.wordsPerActiveMonth).toEqual({ sent: 250, received: 150 });
    expect(result.secondsPerActiveMonth).toEqual({ sent: 600, received: 1200 });
  });

  it("should include emojisTotal when emojiTotals argument is provided", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 100, received: 80 },
      audioMessages: { sent: 0, received: 0 },
      allMessages: { sent: 100, received: 80 }
    };

    const wordCounts: SentReceivedPoint[] = [{ year: 2023, month: 1, sentCount: 500, receivedCount: 400 }];

    const secondCounts: SentReceivedPoint[] = [{ year: 2023, month: 1, sentCount: 0, receivedCount: 0 }];

    const emojiTotals = { sent: 150, received: 120 };

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts, emojiTotals);

    expect(result.emojisTotal).toEqual({ sent: 150, received: 120 });
  });

  it("should leave emojisTotal undefined when emojiTotals argument is not provided", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 100, received: 80 },
      audioMessages: { sent: 0, received: 0 },
      allMessages: { sent: 100, received: 80 }
    };

    const wordCounts: SentReceivedPoint[] = [{ year: 2023, month: 1, sentCount: 500, receivedCount: 400 }];

    const secondCounts: SentReceivedPoint[] = [{ year: 2023, month: 1, sentCount: 0, receivedCount: 0 }];

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

    expect(result.emojisTotal).toBeUndefined();
  });

  it("should handle multiple active years", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 200, received: 150 },
      audioMessages: { sent: 0, received: 0 },
      allMessages: { sent: 200, received: 150 }
    };

    const wordCounts: SentReceivedPoint[] = [
      { year: 2022, month: 12, sentCount: 400, receivedCount: 300 },
      { year: 2023, month: 1, sentCount: 500, receivedCount: 400 },
      { year: 2024, month: 2, sentCount: 600, receivedCount: 500 }
    ];

    const secondCounts: SentReceivedPoint[] = [
      { year: 2022, month: 12, sentCount: 100, receivedCount: 80 },
      { year: 2023, month: 1, sentCount: 120, receivedCount: 100 },
      { year: 2024, month: 2, sentCount: 150, receivedCount: 120 }
    ];

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

    expect(result.numberOfActiveMonths).toBe(3);
    expect(result.numberOfActiveYears).toBe(3);
  });

  it("should handle active months that appear in both word and second counts", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 50, received: 40 },
      audioMessages: { sent: 30, received: 20 },
      allMessages: { sent: 80, received: 60 }
    };

    const wordCounts: SentReceivedPoint[] = [
      { year: 2023, month: 1, sentCount: 200, receivedCount: 150 },
      { year: 2023, month: 2, sentCount: 300, receivedCount: 250 }
    ];

    const secondCounts: SentReceivedPoint[] = [
      { year: 2023, month: 2, sentCount: 180, receivedCount: 120 },
      { year: 2023, month: 3, sentCount: 240, receivedCount: 160 }
    ];

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

    // Active months should be unique: Jan, Feb, Mar = 3 months
    expect(result.numberOfActiveMonths).toBe(3);
    expect(result.numberOfActiveYears).toBe(1);

    // Messages per active month: total / 3
    expect(result.messagesPerActiveMonth.allMessages).toEqual({ sent: 27, received: 20 }); // 80/3=26.67→27, 60/3=20
  });

  it("should round averages correctly", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 100, received: 75 },
      audioMessages: { sent: 0, received: 0 },
      allMessages: { sent: 100, received: 75 }
    };

    const wordCounts: SentReceivedPoint[] = [
      { year: 2023, month: 1, sentCount: 333, receivedCount: 250 },
      { year: 2023, month: 2, sentCount: 333, receivedCount: 250 },
      { year: 2023, month: 3, sentCount: 334, receivedCount: 250 }
    ];

    const secondCounts: SentReceivedPoint[] = [
      { year: 2023, month: 1, sentCount: 0, receivedCount: 0 },
      { year: 2023, month: 2, sentCount: 0, receivedCount: 0 },
      { year: 2023, month: 3, sentCount: 0, receivedCount: 0 }
    ];

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

    expect(result.wordsTotal).toEqual({ sent: 1000, received: 750 });
    expect(result.wordsPerActiveMonth).toEqual({ sent: 333, received: 250 }); // 1000/3 = 333.33 → 333
    expect(result.messagesPerActiveMonth.allMessages).toEqual({ sent: 33, received: 25 }); // 100/3 = 33.33 → 33
  });

  it("should handle zero active months gracefully", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 0, received: 0 },
      audioMessages: { sent: 0, received: 0 },
      allMessages: { sent: 0, received: 0 }
    };

    const wordCounts: SentReceivedPoint[] = [];
    const secondCounts: SentReceivedPoint[] = [];

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

    expect(result.numberOfActiveMonths).toBe(0);
    expect(result.numberOfActiveYears).toBe(0);
    expect(result.messagesPerActiveMonth.allMessages).toEqual({ sent: 0, received: 0 });
    expect(result.wordsPerActiveMonth).toEqual({ sent: 0, received: 0 });
    expect(result.secondsPerActiveMonth).toEqual({ sent: 0, received: 0 });
  });

  it("should calculate totals correctly from data points", () => {
    const messageCounts: MessageCounts = {
      textMessages: { sent: 150, received: 100 },
      audioMessages: { sent: 50, received: 25 },
      allMessages: { sent: 200, received: 125 }
    };

    const wordCounts: SentReceivedPoint[] = [
      { year: 2023, month: 1, sentCount: 100, receivedCount: 80 },
      { year: 2023, month: 2, sentCount: 200, receivedCount: 120 },
      { year: 2023, month: 3, sentCount: 150, receivedCount: 100 }
    ];

    const secondCounts: SentReceivedPoint[] = [
      { year: 2023, month: 1, sentCount: 300, receivedCount: 400 },
      { year: 2023, month: 2, sentCount: 450, receivedCount: 600 }
    ];

    const result = produceBasicStatistics(messageCounts, wordCounts, secondCounts);

    expect(result.wordsTotal).toEqual({ sent: 450, received: 300 });
    expect(result.secondsTotal).toEqual({ sent: 750, received: 1000 });
  });
});
