import { EMOJI_REGEX } from "./emojiDictionary";

/**
 * Counts emojis in a message and returns a map of emoji -> count
 * @param messageContent The message text to analyze
 * @returns Record mapping each emoji found to its count in the message
 */
export default function emojiCount(messageContent: string): Record<string, number> {
  const emojiCounts: Record<string, number> = {};

  if (!messageContent || messageContent.trim().length === 0) {
    return emojiCounts;
  }

  // Use the Unicode emoji regex to find all emojis
  const matches = messageContent.matchAll(EMOJI_REGEX);

  for (const match of matches) {
    const emoji = match[0];
    emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
  }

  return emojiCounts;
}

/**
 * Merges multiple emoji count records into a single record
 * @param counts Array of emoji count records to merge
 * @returns A single record with all emoji counts combined
 */
export function mergeEmojiCounts(counts: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {};

  for (const count of counts) {
    for (const [emoji, num] of Object.entries(count)) {
      merged[emoji] = (merged[emoji] || 0) + num;
    }
  }

  return merged;
}
