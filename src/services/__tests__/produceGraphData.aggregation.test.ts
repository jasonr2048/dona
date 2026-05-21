import { describe, expect, it } from "@jest/globals";
import produceGraphData from "@services/charts/produceGraphData";
import { Conversation } from "@models/processed";

describe("produceGraphData - aggregation scenarios", () => {
  const donorId = "donor-test";

  describe("multi-dataSource grouping", () => {
    it("should group conversations by dataSource and generate separate GraphData for each", () => {
      const whatsappConv1: Conversation = {
        isGroupConversation: false,
        conversationId: "wa-1",
        participants: [donorId, "participant1"],
        messages: [
          { timestamp: new Date(2023, 5, 1).getTime(), wordCount: 10, sender: donorId },
          { timestamp: new Date(2023, 5, 2).getTime(), wordCount: 15, sender: "participant1" }
        ],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "wa-conv-1",
        focusInFeedback: true
      };

      const whatsappConv2: Conversation = {
        isGroupConversation: false,
        conversationId: "wa-2",
        participants: [donorId, "participant2"],
        messages: [{ timestamp: new Date(2023, 5, 3).getTime(), wordCount: 20, sender: donorId }],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "wa-conv-2",
        focusInFeedback: false
      };

      const instagramConv: Conversation = {
        isGroupConversation: false,
        conversationId: "ig-1",
        participants: [donorId, "participant3"],
        messages: [{ timestamp: new Date(2023, 5, 4).getTime(), wordCount: 25, sender: "participant3" }],
        messagesAudio: [],
        dataSource: "Instagram",
        conversationPseudonym: "ig-conv-1",
        focusInFeedback: true
      };

      const facebookConv: Conversation = {
        isGroupConversation: true,
        conversationId: "fb-1",
        participants: [donorId, "participant4", "participant5"],
        messages: [{ timestamp: new Date(2023, 5, 5).getTime(), wordCount: 30, sender: donorId }],
        messagesAudio: [],
        dataSource: "Facebook",
        conversationPseudonym: "fb-conv-1",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [whatsappConv1, whatsappConv2, instagramConv, facebookConv]);

      // Should have three separate data sources
      expect(Object.keys(result)).toHaveLength(3);
      expect(result).toHaveProperty("WhatsApp");
      expect(result).toHaveProperty("Instagram");
      expect(result).toHaveProperty("Facebook");

      // WhatsApp should have 2 conversations
      expect(result["WhatsApp"].participantsPerConversation).toHaveLength(2);
      expect(result["WhatsApp"].participantsPerConversation[0]).toEqual(["participant1"]);
      expect(result["WhatsApp"].participantsPerConversation[1]).toEqual(["participant2"]);
      expect(result["WhatsApp"].focusConversations).toEqual(["wa-conv-1"]); // Only conv1 has focus

      // Instagram should have 1 conversation
      expect(result["Instagram"].participantsPerConversation).toHaveLength(1);
      expect(result["Instagram"].participantsPerConversation[0]).toEqual(["participant3"]);
      expect(result["Instagram"].focusConversations).toEqual(["ig-conv-1"]);

      // Facebook should have 1 conversation with 2 other participants
      expect(result["Facebook"].participantsPerConversation).toHaveLength(1);
      expect(result["Facebook"].participantsPerConversation[0]).toEqual(["participant4", "participant5"]);
      expect(result["Facebook"].focusConversations).toEqual(["fb-conv-1"]);

      // Each dataSource should have its own aggregated statistics
      expect(result["WhatsApp"].basicStatistics.messagesTotal.textMessages.sent).toBe(2); // 2 sent from donor
      expect(result["Instagram"].basicStatistics.messagesTotal.textMessages.sent).toBe(0); // None sent
      expect(result["Facebook"].basicStatistics.messagesTotal.textMessages.sent).toBe(1); // 1 sent
    });

    it("should correctly aggregate dailyWords within each dataSource group", () => {
      const wa1: Conversation = {
        isGroupConversation: false,
        conversationId: "wa-1",
        participants: [donorId, "p1"],
        messages: [
          { timestamp: new Date(2023, 3, 10, 10, 0).getTime(), wordCount: 10, sender: donorId },
          { timestamp: new Date(2023, 3, 10, 14, 0).getTime(), wordCount: 15, sender: "p1" }
        ],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "wa-1",
        focusInFeedback: true
      };

      const wa2: Conversation = {
        isGroupConversation: false,
        conversationId: "wa-2",
        participants: [donorId, "p2"],
        messages: [
          { timestamp: new Date(2023, 3, 10, 16, 0).getTime(), wordCount: 20, sender: donorId },
          { timestamp: new Date(2023, 3, 11, 10, 0).getTime(), wordCount: 25, sender: "p2" }
        ],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "wa-2",
        focusInFeedback: true
      };

      const ig1: Conversation = {
        isGroupConversation: false,
        conversationId: "ig-1",
        participants: [donorId, "p3"],
        messages: [{ timestamp: new Date(2023, 3, 10, 12, 0).getTime(), wordCount: 30, sender: "p3" }],
        messagesAudio: [],
        dataSource: "Instagram",
        conversationPseudonym: "ig-1",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [wa1, wa2, ig1]);

      // WhatsApp should aggregate counts from both conversations on April 10
      const waApril10 = result["WhatsApp"].dailyWords.find(d => d.year === 2023 && d.month === 4 && d.date === 10);
      expect(waApril10).toBeDefined();
      expect(waApril10!.sentCount).toBe(30); // 10 + 20 from both conversations
      expect(waApril10!.receivedCount).toBe(15); // Only from wa1

      // WhatsApp should have April 11 with only received from wa2
      const waApril11 = result["WhatsApp"].dailyWords.find(d => d.year === 2023 && d.month === 4 && d.date === 11);
      expect(waApril11).toBeDefined();
      expect(waApril11!.sentCount).toBe(0);
      expect(waApril11!.receivedCount).toBe(25);

      // Instagram should have separate aggregation
      const igApril10 = result["Instagram"].dailyWords.find(d => d.year === 2023 && d.month === 4 && d.date === 10);
      expect(igApril10).toBeDefined();
      expect(igApril10!.sentCount).toBe(0);
      expect(igApril10!.receivedCount).toBe(30);
    });
  });

  describe("emoji aggregation across conversations", () => {
    it("should aggregate emoji counts from multiple conversations within same dataSource", () => {
      const conv1: Conversation = {
        isGroupConversation: false,
        conversationId: "conv1",
        participants: [donorId, "p1"],
        messages: [
          {
            timestamp: new Date(2023, 0, 1).getTime(),
            wordCount: 10,
            sender: donorId,
            emojiCounts: { "😀": 2, "👍": 1 }
          },
          {
            timestamp: new Date(2023, 0, 2).getTime(),
            wordCount: 10,
            sender: "p1",
            emojiCounts: { "😀": 1, "❤️": 3 }
          }
        ],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "conv1",
        focusInFeedback: true
      };

      const conv2: Conversation = {
        isGroupConversation: false,
        conversationId: "conv2",
        participants: [donorId, "p2"],
        messages: [
          {
            timestamp: new Date(2023, 0, 3).getTime(),
            wordCount: 15,
            sender: donorId,
            emojiCounts: { "😀": 3, "🎉": 2 }
          },
          {
            timestamp: new Date(2023, 0, 4).getTime(),
            wordCount: 12,
            sender: "p2",
            emojiCounts: { "❤️": 1, "🎉": 1 }
          }
        ],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "conv2",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [conv1, conv2]);

      expect(result["WhatsApp"].emojiDistribution).toBeDefined();
      const { sent, received } = result["WhatsApp"].emojiDistribution!;

      // Sent emojis should be aggregated from both conversations
      expect(sent["😀"]).toBe(5); // 2 from conv1 + 3 from conv2
      expect(sent["👍"]).toBe(1); // 1 from conv1
      expect(sent["🎉"]).toBe(2); // 2 from conv2

      // Received emojis should be aggregated from both conversations
      expect(received["😀"]).toBe(1); // 1 from conv1
      expect(received["❤️"]).toBe(4); // 3 from conv1 + 1 from conv2
      expect(received["🎉"]).toBe(1); // 1 from conv2

      // Total counts should match
      expect(result["WhatsApp"].basicStatistics.emojisTotal).toEqual({
        sent: 8, // 2+1+3+2
        received: 6 // 1+3+1+1
      });
    });

    it("should not mix emoji counts between different dataSources", () => {
      const waConv: Conversation = {
        isGroupConversation: false,
        conversationId: "wa",
        participants: [donorId, "p1"],
        messages: [
          {
            timestamp: Date.now(),
            wordCount: 10,
            sender: donorId,
            emojiCounts: { "😀": 5 }
          }
        ],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "wa-conv",
        focusInFeedback: true
      };

      const igConv: Conversation = {
        isGroupConversation: false,
        conversationId: "ig",
        participants: [donorId, "p2"],
        messages: [
          {
            timestamp: Date.now(),
            wordCount: 10,
            sender: donorId,
            emojiCounts: { "😀": 3 }
          }
        ],
        messagesAudio: [],
        dataSource: "Instagram",
        conversationPseudonym: "ig-conv",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [waConv, igConv]);

      // Each dataSource should have its own emoji counts
      expect(result["WhatsApp"].emojiDistribution!.sent["😀"]).toBe(5);
      expect(result["Instagram"].emojiDistribution!.sent["😀"]).toBe(3);

      // Totals should be separate
      expect(result["WhatsApp"].basicStatistics.emojisTotal!.sent).toBe(5);
      expect(result["Instagram"].basicStatistics.emojisTotal!.sent).toBe(3);
    });
  });

  describe("audio length distribution bucketing and rounding", () => {
    it("should round audio lengths to nearest second and bucket them", () => {
      const conv: Conversation = {
        isGroupConversation: false,
        conversationId: "audio-conv",
        participants: [donorId, "p1"],
        messages: [],
        messagesAudio: [
          { timestamp: Date.now(), lengthSeconds: 30.4, sender: donorId }, // rounds to 30
          { timestamp: Date.now(), lengthSeconds: 30.6, sender: donorId }, // rounds to 31
          { timestamp: Date.now(), lengthSeconds: 45.2, sender: "p1" }, // rounds to 45
          { timestamp: Date.now(), lengthSeconds: 45.8, sender: "p1" }, // rounds to 46
          { timestamp: Date.now(), lengthSeconds: 60.0, sender: donorId }, // exactly 60
          { timestamp: Date.now(), lengthSeconds: 30.5, sender: "p1" } // rounds to 31 (0.5 rounds up)
        ],
        dataSource: "WhatsApp",
        conversationPseudonym: "audio-test",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [conv]);

      const audioDist = result["WhatsApp"].audioLengthDistribution;

      // Check sent audio (from donor)
      expect(audioDist.sent["30"]).toBe(1); // 30.4 rounded
      expect(audioDist.sent["31"]).toBe(1); // 30.6 rounded
      expect(audioDist.sent["60"]).toBe(1); // exactly 60

      // Check received audio (from p1)
      expect(audioDist.received["45"]).toBe(1); // 45.2 rounded
      expect(audioDist.received["46"]).toBe(1); // 45.8 rounded
      expect(audioDist.received["31"]).toBe(1); // 30.5 rounded (0.5 rounds up with Math.round)
    });

    it("should aggregate audio lengths across multiple conversations", () => {
      const conv1: Conversation = {
        isGroupConversation: false,
        conversationId: "c1",
        participants: [donorId, "p1"],
        messages: [],
        messagesAudio: [
          { timestamp: Date.now(), lengthSeconds: 30, sender: donorId },
          { timestamp: Date.now(), lengthSeconds: 30, sender: donorId },
          { timestamp: Date.now(), lengthSeconds: 45, sender: "p1" }
        ],
        dataSource: "WhatsApp",
        conversationPseudonym: "c1",
        focusInFeedback: true
      };

      const conv2: Conversation = {
        isGroupConversation: false,
        conversationId: "c2",
        participants: [donorId, "p2"],
        messages: [],
        messagesAudio: [
          { timestamp: Date.now(), lengthSeconds: 30, sender: donorId },
          { timestamp: Date.now(), lengthSeconds: 45, sender: "p2" },
          { timestamp: Date.now(), lengthSeconds: 45, sender: "p2" }
        ],
        dataSource: "WhatsApp",
        conversationPseudonym: "c2",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [conv1, conv2]);

      const audioDist = result["WhatsApp"].audioLengthDistribution;

      // Should aggregate counts
      expect(audioDist.sent["30"]).toBe(3); // 2 from conv1 + 1 from conv2
      expect(audioDist.received["45"]).toBe(3); // 1 from conv1 + 2 from conv2
    });

    it("should ignore audio messages with zero or negative length", () => {
      const conv: Conversation = {
        isGroupConversation: false,
        conversationId: "invalid-audio",
        participants: [donorId, "p1"],
        messages: [],
        messagesAudio: [
          { timestamp: Date.now(), lengthSeconds: 0, sender: donorId },
          { timestamp: Date.now(), lengthSeconds: -5, sender: "p1" },
          { timestamp: Date.now(), lengthSeconds: 30, sender: donorId }
        ],
        dataSource: "WhatsApp",
        conversationPseudonym: "invalid",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [conv]);

      const audioDist = result["WhatsApp"].audioLengthDistribution;

      // Only valid audio should be counted
      expect(audioDist.sent["30"]).toBe(1);
      expect(audioDist.sent["0"]).toBeUndefined();
      expect(audioDist.received["-5"]).toBeUndefined();
    });
  });

  describe("sliding window over year boundaries", () => {
    it("should correctly calculate sliding window mean across December to January", () => {
      const conv: Conversation = {
        isGroupConversation: false,
        conversationId: "year-boundary",
        participants: [donorId, "p1"],
        messages: [
          // Late December 2023
          { timestamp: new Date(2023, 11, 28, 12, 0).getTime(), wordCount: 10, sender: donorId },
          { timestamp: new Date(2023, 11, 29, 12, 0).getTime(), wordCount: 15, sender: "p1" },
          { timestamp: new Date(2023, 11, 30, 12, 0).getTime(), wordCount: 20, sender: donorId },
          { timestamp: new Date(2023, 11, 31, 12, 0).getTime(), wordCount: 25, sender: "p1" },
          // Early January 2024
          { timestamp: new Date(2024, 0, 1, 12, 0).getTime(), wordCount: 30, sender: donorId },
          { timestamp: new Date(2024, 0, 2, 12, 0).getTime(), wordCount: 35, sender: "p1" },
          { timestamp: new Date(2024, 0, 3, 12, 0).getTime(), wordCount: 40, sender: donorId }
        ],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "boundary-test",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [conv]);

      const slidingWindow = result["WhatsApp"].slidingWindowMeanDailyWords;

      // Find December 31, 2023 in sliding window
      const dec31 = slidingWindow.find(d => d.year === 2023 && d.month === 12 && d.date === 31);
      expect(dec31).toBeDefined();
      // Should have data (window includes surrounding days)
      expect(dec31!.sentCount).toBeGreaterThan(0);
      expect(dec31!.receivedCount).toBeGreaterThan(0);

      // Find January 1, 2024 in sliding window
      const jan1 = slidingWindow.find(d => d.year === 2024 && d.month === 1 && d.date === 1);
      expect(jan1).toBeDefined();
      // Should have data (window includes surrounding days from both years)
      expect(jan1!.sentCount).toBeGreaterThan(0);
      expect(jan1!.receivedCount).toBeGreaterThan(0);

      // Verify the sliding window is continuous (no gaps)
      const allDates = slidingWindow.map(d => new Date(d.year, d.month - 1, d.date).getTime());
      allDates.sort((a, b) => a - b);

      for (let i = 1; i < allDates.length; i++) {
        const dayDiff = (allDates[i] - allDates[i - 1]) / (1000 * 60 * 60 * 24);
        expect(dayDiff).toBe(1); // Should be exactly 1 day apart
      }
    });

    it("should handle leap year boundary (Feb 29 to Mar 1)", () => {
      const conv: Conversation = {
        isGroupConversation: false,
        conversationId: "leap-year",
        participants: [donorId, "p1"],
        messages: [
          { timestamp: new Date(2024, 1, 28, 12, 0).getTime(), wordCount: 10, sender: donorId }, // Feb 28
          { timestamp: new Date(2024, 1, 29, 12, 0).getTime(), wordCount: 15, sender: "p1" }, // Feb 29 (leap day)
          { timestamp: new Date(2024, 2, 1, 12, 0).getTime(), wordCount: 20, sender: donorId } // Mar 1
        ],
        messagesAudio: [],
        dataSource: "Facebook",
        conversationPseudonym: "leap-test",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [conv]);

      const slidingWindow = result["Facebook"].slidingWindowMeanDailyWords;

      // Verify Feb 29 exists
      const feb29 = slidingWindow.find(d => d.year === 2024 && d.month === 2 && d.date === 29);
      expect(feb29).toBeDefined();

      // Verify Mar 1 exists
      const mar1 = slidingWindow.find(d => d.year === 2024 && d.month === 3 && d.date === 1);
      expect(mar1).toBeDefined();

      // Verify continuity
      const feb28 = slidingWindow.find(d => d.year === 2024 && d.month === 2 && d.date === 28);
      expect(feb28).toBeDefined();

      // All three dates should be present in sequence
      const dates = [feb28, feb29, mar1].map(d => (d ? new Date(d.year, d.month - 1, d.date).getTime() : 0));
      expect(dates[1] - dates[0]).toBe(24 * 60 * 60 * 1000); // 1 day
      expect(dates[2] - dates[1]).toBe(24 * 60 * 60 * 1000); // 1 day
    });

    it("should handle multi-year data spanning multiple year boundaries", () => {
      const conv: Conversation = {
        isGroupConversation: false,
        conversationId: "multi-year",
        participants: [donorId, "p1"],
        messages: [
          { timestamp: new Date(2022, 11, 31, 12, 0).getTime(), wordCount: 10, sender: donorId }, // Dec 31, 2022
          { timestamp: new Date(2023, 0, 1, 12, 0).getTime(), wordCount: 15, sender: "p1" }, // Jan 1, 2023
          { timestamp: new Date(2023, 11, 31, 12, 0).getTime(), wordCount: 20, sender: donorId }, // Dec 31, 2023
          { timestamp: new Date(2024, 0, 1, 12, 0).getTime(), wordCount: 25, sender: "p1" } // Jan 1, 2024
        ],
        messagesAudio: [],
        dataSource: "Instagram",
        conversationPseudonym: "multi-year-test",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [conv]);

      const slidingWindow = result["Instagram"].slidingWindowMeanDailyWords;

      // Verify both year boundaries are present
      const dec31_2022 = slidingWindow.find(d => d.year === 2022 && d.month === 12 && d.date === 31);
      const jan1_2023 = slidingWindow.find(d => d.year === 2023 && d.month === 1 && d.date === 1);
      const dec31_2023 = slidingWindow.find(d => d.year === 2023 && d.month === 12 && d.date === 31);
      const jan1_2024 = slidingWindow.find(d => d.year === 2024 && d.month === 1 && d.date === 1);

      expect(dec31_2022).toBeDefined();
      expect(jan1_2023).toBeDefined();
      expect(dec31_2023).toBeDefined();
      expect(jan1_2024).toBeDefined();

      // Verify the sliding window handles year transitions correctly
      // The window should have entries but doesn't need to cover all days (sparse data)
      expect(slidingWindow.length).toBeGreaterThan(0);

      // Verify that dates are properly formatted across year boundaries
      slidingWindow.forEach(point => {
        expect(point.year).toBeGreaterThanOrEqual(2022);
        expect(point.year).toBeLessThanOrEqual(2024);
        expect(point.month).toBeGreaterThanOrEqual(1);
        expect(point.month).toBeLessThanOrEqual(12);
        expect(point.date).toBeGreaterThanOrEqual(1);
        expect(point.date).toBeLessThanOrEqual(31);
      });
    });
  });
});
