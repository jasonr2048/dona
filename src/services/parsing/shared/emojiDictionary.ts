/**
 * Emoji dictionary based on Unicode Emoji 17.0 specification
 * Reference: https://unicode.org/Public/emoji/17.0/emoji-test.txt
 * Used for ChatDashboard analysis as described in:
 * https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11133087/
 *
 * Loads fully qualified emojis from unicode_org_fully_qualified_emojis.txt
 * This file contains ~4000 emojis extracted from the official Unicode emoji test data.
 */

import fs from "fs";
import path from "path";

/**
 * Lazy-loaded emoji set for performance
 * Initialized on first access and cached for subsequent calls
 */
let EMOJI_SET_CACHE: Set<string> | null = null;

/**
 * Loads emojis from the Unicode emoji file
 * Skips comment lines (lines starting with #) and empty lines
 * @returns Set of emoji strings for O(1) lookup
 */
function loadEmojisFromFile(): Set<string> {
  const filePath = path.join(__dirname, "unicode_org_fully_qualified_emojis.txt");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split("\n");

  const emojis = new Set<string>();
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (trimmed && !trimmed.startsWith("#")) {
      emojis.add(trimmed);
    }
  }

  return emojis;
}

/**
 * Gets the emoji set, loading it on first access
 * Cached for performance across multiple calls
 * @returns Set of all fully qualified emojis
 */
export function getEmojiSet(): Set<string> {
  if (!EMOJI_SET_CACHE) {
    EMOJI_SET_CACHE = loadEmojisFromFile();
  }
  return EMOJI_SET_CACHE;
}

/**
 * Regex pattern to match all emojis
 * This pattern matches emoji characters including those with skin tone modifiers
 */
export const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

/**
 * For backwards compatibility - exports the emoji set
 * Note: This is lazy-loaded, so the Set is only created when first accessed
 */
export const EMOJI_SET = new Proxy({} as Set<string>, {
  get(target, prop) {
    const set = getEmojiSet();
    return (set as any)[prop];
  },
  has(target, prop) {
    const set = getEmojiSet();
    return prop in set;
  }
});
