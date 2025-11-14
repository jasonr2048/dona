import { createHash } from "crypto";
import { Conversation, Message, MessageAudio } from "@models/processed";
import { getAliasConfig } from "@services/parsing/shared/aliasConfig";

/**
 * Computes a SHA-256 hash for a conversation based on its messages.
 *
 * The hash is computed from all messages in a conversation (both text and audio)
 * to enable duplicate detection. The hash includes:
 * - For regular messages: timestamp, wordCount, senderRole ("ego" | "alter")
 * - For audio messages: timestamp, lengthSeconds, senderRole ("ego" | "alter")
 *
 * Messages are sorted by timestamp before hashing to ensure consistent results
 * regardless of the order in which messages appear in the input.
 *
 * @param conversation - The conversation to hash
 * @returns A SHA-256 hash as a hexadecimal string, or null if conversation has no messages
 */
export function computeConversationHash(conversation: Conversation): string | null {
  const textMessages = conversation.messages || [];
  const audioMessages = conversation.messagesAudio || [];

  if (textMessages.length === 0 && audioMessages.length === 0) {
    return null;
  }

  // Create a combined array of message data for hashing
  interface MessageData {
    timestamp: number;
    type: "text" | "audio";
    wordCount?: number;
    lengthSeconds?: number;
    senderRole: "ego" | "alter";
  }

  const { donorAlias } = getAliasConfig();

  const toRole = (sender: string): "ego" | "alter" => (sender === donorAlias ? "ego" : "alter");

  const messageData: MessageData[] = [
    ...textMessages.map((msg: Message) => ({
      timestamp: msg.timestamp,
      type: "text" as const,
      wordCount: msg.wordCount,
      senderRole: toRole(msg.sender)
    })),
    ...audioMessages.map((msg: MessageAudio) => ({
      timestamp: msg.timestamp,
      type: "audio" as const,
      lengthSeconds: msg.lengthSeconds,
      senderRole: toRole(msg.sender)
    }))
  ];

  // Sort by timestamp to ensure consistent ordering
  messageData.sort((a, b) => a.timestamp - b.timestamp);

  // Convert to a stable string representation
  const dataString = JSON.stringify(messageData);

  // Compute SHA-256 hash
  const hash = createHash("sha256");
  hash.update(dataString);
  return hash.digest("hex");
}

/**
 * Checks if a conversation meets the minimum message threshold for hash computation.
 *
 * @param conversation - The conversation to check
 * @param minMessages - Minimum number of messages required (default: 50)
 * @returns True if the conversation has enough messages
 */
export function shouldHashConversation(conversation: Conversation, minMessages: number = 50): boolean {
  const textCount = conversation.messages?.length || 0;
  const audioCount = conversation.messagesAudio?.length || 0;
  const totalMessages = textCount + audioCount;

  return totalMessages >= minMessages;
}
