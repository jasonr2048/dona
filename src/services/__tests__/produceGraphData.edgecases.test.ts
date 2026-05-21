import { describe, expect, it } from "@jest/globals";
import produceGraphData from "@services/charts/produceGraphData";
import { Conversation } from "@models/processed";

describe("produceGraphData - edge cases", () => {
  const donorId = "donor-test";

  describe("empty conversations", () => {
    it("should handle empty conversations array without throwing", () => {
      const result = produceGraphData(donorId, []);

      expect(result).toEqual({});
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe("audio-only conversations", () => {
    it("should populate audioLengthDistribution and have empty monthlyWordsPerConversation", () => {
      const audioOnlyConversation: Conversation = {
        isGroupConversation: false,
        conversationId: "audio-conv-1",
        participants: [donorId, "participant1"],
        messages: [], // No text messages
        messagesAudio: [
          {
            timestamp: new Date(2023, 0, 15, 10, 0).getTime(),
            lengthSeconds: 30,
            sender: donorId
          },
          {
            timestamp: new Date(2023, 0, 16, 14, 0).getTime(),
            lengthSeconds: 45,
            sender: "participant1"
          },
          {
            timestamp: new Date(2023, 0, 17, 9, 30).getTime(),
            lengthSeconds: 60,
            sender: donorId
          }
        ],
        dataSource: "WhatsApp",
        conversationPseudonym: "audio-conv",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [audioOnlyConversation]);

      expect(result).toHaveProperty("WhatsApp");
      const whatsappData = result["WhatsApp"];

      // Should have audio length distribution
      expect(whatsappData.audioLengthDistribution).toBeDefined();
      expect(whatsappData.audioLengthDistribution.sent).toEqual({
        "30": 1,
        "60": 1
      });
      expect(whatsappData.audioLengthDistribution.received).toEqual({
        "45": 1
      });

      // monthlyWordsPerConversation should be empty (no text messages)
      expect(Object.keys(whatsappData.monthlyWordsPerConversation)).toHaveLength(1);
      expect(whatsappData.monthlyWordsPerConversation["audio-conv"]).toEqual([]);

      // dailyWords should be empty
      expect(whatsappData.dailyWords).toEqual([]);

      // basicStatistics should reflect only audio messages
      expect(whatsappData.basicStatistics.messagesTotal.audioMessages).toEqual({ sent: 2, received: 1 });
      expect(whatsappData.basicStatistics.messagesTotal.textMessages).toEqual({ sent: 0, received: 0 });
      expect(whatsappData.basicStatistics.wordsTotal).toEqual({ sent: 0, received: 0 });
      expect(whatsappData.basicStatistics.secondsTotal).toEqual({ sent: 90, received: 45 });
    });
  });

  describe("emoji distribution", () => {
    it("should have undefined emojiDistribution when no emojis are present", () => {
      const noEmojiConversation: Conversation = {
        isGroupConversation: false,
        conversationId: "no-emoji-conv",
        participants: [donorId, "participant1"],
        messages: [
          {
            timestamp: new Date(2023, 0, 10, 12, 0).getTime(),
            wordCount: 20,
            sender: donorId
            // No emojiCounts field
          },
          {
            timestamp: new Date(2023, 0, 11, 15, 0).getTime(),
            wordCount: 15,
            sender: "participant1"
            // No emojiCounts field
          }
        ],
        messagesAudio: [],
        dataSource: "Facebook",
        conversationPseudonym: "no-emoji",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [noEmojiConversation]);

      expect(result).toHaveProperty("Facebook");
      expect(result["Facebook"].emojiDistribution).toBeUndefined();
      expect(result["Facebook"].basicStatistics.emojisTotal).toBeUndefined();
    });

    it("should populate emojiDistribution when emojis are present", () => {
      const emojiConversation: Conversation = {
        isGroupConversation: false,
        conversationId: "emoji-conv",
        participants: [donorId, "participant1"],
        messages: [
          {
            timestamp: new Date(2023, 0, 10, 12, 0).getTime(),
            wordCount: 20,
            sender: donorId,
            emojiCounts: {
              "😀": 2,
              "👍": 1
            }
          },
          {
            timestamp: new Date(2023, 0, 11, 15, 0).getTime(),
            wordCount: 15,
            sender: "participant1",
            emojiCounts: {
              "😀": 1,
              "❤️": 3
            }
          }
        ],
        messagesAudio: [],
        dataSource: "Facebook",
        conversationPseudonym: "emoji-conv",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [emojiConversation]);

      expect(result).toHaveProperty("Facebook");
      expect(result["Facebook"].emojiDistribution).toBeDefined();
      expect(result["Facebook"].emojiDistribution!.sent).toEqual({
        "😀": 2,
        "👍": 1
      });
      expect(result["Facebook"].emojiDistribution!.received).toEqual({
        "😀": 1,
        "❤️": 3
      });
      expect(result["Facebook"].basicStatistics.emojisTotal).toEqual({ sent: 3, received: 4 });
    });

    it("should treat different emoji variations as separate keys", () => {
      // This test documents current behavior: different skin tones/ZWJ sequences are separate
      const emojiVariationsConversation: Conversation = {
        isGroupConversation: false,
        conversationId: "emoji-var-conv",
        participants: [donorId, "participant1"],
        messages: [
          {
            timestamp: new Date(2023, 0, 10, 12, 0).getTime(),
            wordCount: 10,
            sender: donorId,
            emojiCounts: {
              "👍": 1,
              "👍🏻": 1, // Different skin tone
              "👨‍👩‍👧": 1 // ZWJ sequence
            }
          }
        ],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "emoji-var",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [emojiVariationsConversation]);

      expect(result["WhatsApp"].emojiDistribution).toBeDefined();
      // Each variation is counted separately
      expect(result["WhatsApp"].emojiDistribution!.sent).toHaveProperty("👍");
      expect(result["WhatsApp"].emojiDistribution!.sent).toHaveProperty("👍🏻");
      expect(result["WhatsApp"].emojiDistribution!.sent).toHaveProperty("👨‍👩‍👧");
      expect(Object.keys(result["WhatsApp"].emojiDistribution!.sent).length).toBe(3);
    });
  });

  describe("mixed scenarios", () => {
    it("should handle conversation with both text and audio messages", () => {
      const mixedConversation: Conversation = {
        isGroupConversation: true,
        conversationId: "mixed-conv",
        participants: [donorId, "participant1", "participant2"],
        messages: [
          {
            timestamp: new Date(2023, 2, 5, 10, 0).getTime(),
            wordCount: 25,
            sender: donorId,
            emojiCounts: { "🎉": 2 }
          }
        ],
        messagesAudio: [
          {
            timestamp: new Date(2023, 2, 6, 11, 0).getTime(),
            lengthSeconds: 120,
            sender: "participant1"
          }
        ],
        dataSource: "Telegram",
        conversationPseudonym: "mixed",
        focusInFeedback: false
      };

      const result = produceGraphData(donorId, [mixedConversation]);

      expect(result).toHaveProperty("Telegram");
      const telegramData = result["Telegram"];

      // Should have both words and audio
      expect(telegramData.monthlyWordsPerConversation["mixed"]).toHaveLength(1);
      expect(telegramData.audioLengthDistribution.received).toHaveProperty("120");

      // Should have emoji distribution
      expect(telegramData.emojiDistribution).toBeDefined();
      expect(telegramData.emojiDistribution!.sent).toHaveProperty("🎉");

      // Should be in focusConversations only if focusInFeedback is true
      expect(telegramData.focusConversations).toEqual([]);
    });

    it("should handle multiple conversations from different data sources", () => {
      const conversation1: Conversation = {
        isGroupConversation: false,
        conversationId: "conv1",
        participants: [donorId, "p1"],
        messages: [{ timestamp: Date.now(), wordCount: 10, sender: donorId }],
        messagesAudio: [],
        dataSource: "WhatsApp",
        conversationPseudonym: "conv1",
        focusInFeedback: true
      };

      const conversation2: Conversation = {
        isGroupConversation: false,
        conversationId: "conv2",
        participants: [donorId, "p2"],
        messages: [{ timestamp: Date.now(), wordCount: 15, sender: "p2" }],
        messagesAudio: [],
        dataSource: "Telegram",
        conversationPseudonym: "conv2",
        focusInFeedback: true
      };

      const result = produceGraphData(donorId, [conversation1, conversation2]);

      expect(Object.keys(result)).toContain("WhatsApp");
      expect(Object.keys(result)).toContain("Telegram");
      expect(result["WhatsApp"].participantsPerConversation).toEqual([["p1"]]);
      expect(result["Telegram"].participantsPerConversation).toEqual([["p2"]]);
    });
  });
});
