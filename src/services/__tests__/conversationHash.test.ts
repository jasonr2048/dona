import { computeConversationHash, shouldHashConversation } from "../conversationHash";
import { Conversation } from "@models/processed";
import { describe, expect, it } from "@jest/globals";

// Mock aliasConfig so computeConversationHash can resolve donor alias
// @ts-ignore
jest.mock("@services/parsing/shared/aliasConfig", () => ({
  getAliasConfig: () => ({
    systemAlias: "System",
    contactAlias: "Contact",
    donorAlias: "Alice",
    chatAlias: "Chat"
  })
}));

describe("computeConversationHash", () => {
  it("should return null for a conversation with no messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash = computeConversationHash(conversation);
    expect(hash).toBeNull();
  });

  it("should compute a hash for a conversation with only text messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash = computeConversationHash(conversation);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  it("should compute a hash for a conversation with only audio messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [],
      messagesAudio: [
        { timestamp: 1000, lengthSeconds: 30, sender: "Alice" },
        { timestamp: 2000, lengthSeconds: 45, sender: "Bob" }
      ],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash = computeConversationHash(conversation);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
  });

  it("should compute a hash for a conversation with both text and audio messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 3000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [{ timestamp: 2000, lengthSeconds: 30, sender: "Alice" }],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash = computeConversationHash(conversation);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
  });

  it("should produce the same hash for identical conversations", () => {
    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).toEqual(hash2);
  });

  it("should produce different hashes for conversations with different message content", () => {
    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 15, sender: "Bob" } // Different word count
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).not.toEqual(hash2);
  });

  it("should produce the same hash when a non-donor sender name changes (role preserved)", () => {
    // donorAlias is mocked as "Alice" above
    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" }, // donor -> ego
        { timestamp: 2000, wordCount: 10, sender: "Bob" } // non-donor -> alter
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" }, // donor -> ego
        { timestamp: 2000, wordCount: 10, sender: "Charlie" } // different non-donor -> still alter
      ],
      messagesAudio: [],
      participants: ["Alice", "Charlie"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).toEqual(hash2);
  });

  it("should produce different hashes when sender changes", () => {
    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Bob" }, // Sender swapped
        { timestamp: 2000, wordCount: 10, sender: "Alice" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).not.toEqual(hash2);
  });

  it("should produce the same hash regardless of message order in input", () => {
    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" },
        { timestamp: 3000, wordCount: 15, sender: "Alice" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    // Messages in different order but same timestamps
    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 3000, wordCount: 15, sender: "Alice" },
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).toEqual(hash2);
  });

  it("should produce different hashes when timestamps differ", () => {
    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2000, wordCount: 10, sender: "Bob" }
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "WhatsApp",
      messages: [
        { timestamp: 1000, wordCount: 5, sender: "Alice" },
        { timestamp: 2001, wordCount: 10, sender: "Bob" } // Different timestamp
      ],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).not.toEqual(hash2);
  });

  it("should not include conversation metadata in hash", () => {
    const conversation1: Conversation = {
      dataSource: "WhatsApp",
      messages: [{ timestamp: 1000, wordCount: 5, sender: "Alice" }],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    const conversation2: Conversation = {
      dataSource: "Facebook", // Different data source
      messages: [{ timestamp: 1000, wordCount: 5, sender: "Alice" }],
      messagesAudio: [],
      participants: ["Alice", "Charlie"], // Different participants
      conversationPseudonym: "Conv2" // Different pseudonym
    };

    const hash1 = computeConversationHash(conversation1);
    const hash2 = computeConversationHash(conversation2);
    expect(hash1).toEqual(hash2); // Should be same since messages are identical
  });
});

describe("shouldHashConversation", () => {
  it("should return true for conversation with exactly minimum messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(100)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(true);
  });

  it("should return true for conversation with more than minimum messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(150)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(true);
  });

  it("should return false for conversation with fewer than minimum messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(50)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(false);
  });

  it("should count both text and audio messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(60)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: Array(40)
        .fill(null)
        .map((_, i) => ({
          timestamp: (i + 60) * 1000,
          lengthSeconds: 30,
          sender: "Bob"
        })),
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(true);
  });

  it("should use default threshold of 50 when not specified", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: Array(49)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 1000,
          wordCount: 5,
          sender: "Alice"
        })),
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation)).toBe(false);
  });

  it("should handle conversation with no messages", () => {
    const conversation: Conversation = {
      dataSource: "WhatsApp",
      messages: [],
      messagesAudio: [],
      participants: ["Alice", "Bob"],
      conversationPseudonym: "Conv1"
    };

    expect(shouldHashConversation(conversation, 100)).toBe(false);
  });
});
