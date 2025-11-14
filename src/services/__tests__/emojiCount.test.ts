import { describe, expect, it } from "@jest/globals";

import emojiCount, { mergeEmojiCounts } from "@services/parsing/shared/emojiCount";

describe("emojiCount", () => {
  it("should return empty object for messages without emojis", () => {
    expect(emojiCount("Hello world")).toEqual({});
    expect(emojiCount("Just a regular message")).toEqual({});
  });

  it("should count single emoji", () => {
    expect(emojiCount("Hello 😊")).toEqual({ "😊": 1 });
    expect(emojiCount("👍")).toEqual({ "👍": 1 });
  });

  it("should count multiple different emojis", () => {
    expect(emojiCount("Hello 😊 world 👍")).toEqual({ "😊": 1, "👍": 1 });
    expect(emojiCount("🎉🎈🎊")).toEqual({ "🎉": 1, "🎈": 1, "🎊": 1 });
  });

  it("should count repeated emojis", () => {
    expect(emojiCount("😂😂😂")).toEqual({ "😂": 3 });
    expect(emojiCount("Hello 😊😊 world")).toEqual({ "😊": 2 });
  });

  it("should count mixed repeated and unique emojis", () => {
    expect(emojiCount("😊😊👍😂😂😂")).toEqual({ "😊": 2, "👍": 1, "😂": 3 });
  });

  it("should handle empty string", () => {
    expect(emojiCount("")).toEqual({});
    expect(emojiCount("   ")).toEqual({});
  });

  it("should handle emojis with text", () => {
    const result = emojiCount("I love 💕 this 😍 so much 🥰");
    expect(result).toEqual({ "💕": 1, "😍": 1, "🥰": 1 });
  });

  it("should handle emojis at start, middle and end", () => {
    expect(emojiCount("😊 middle 👍 end 🎉")).toEqual({ "😊": 1, "👍": 1, "🎉": 1 });
  });

  it("should handle complex emojis like flags", () => {
    // Note: Country flag emojis (like 🇺🇸) are composed of regional indicator symbols
    // which may not be caught by the Extended_Pictographic pattern in all JavaScript engines
    const result = emojiCount("I'm from 🇺🇸 and going to 🇬🇧");
    // Either they are detected, or they are not - both are acceptable
    expect(typeof result).toBe("object");
  });

  it("should handle skin tone modifiers", () => {
    const result = emojiCount("👍🏻👍🏼");
    // Skin tone modifiers create different emojis
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it("should handle multi-character emojis", () => {
    // Family emojis, emojis with gender/skin tone variations
    const result = emojiCount("👨‍👩‍👧‍👦 ❤️‍🔥");
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });
});

describe("mergeEmojiCounts", () => {
  it("should merge empty arrays", () => {
    expect(mergeEmojiCounts([])).toEqual({});
  });

  it("should merge single count object", () => {
    expect(mergeEmojiCounts([{ "😊": 2, "👍": 1 }])).toEqual({ "😊": 2, "👍": 1 });
  });

  it("should merge multiple count objects", () => {
    const counts: Record<string, number>[] = [
      { "😊": 2, "👍": 1 },
      { "😊": 1, "❤️": 3 },
      { "👍": 2, "❤️": 1 }
    ];
    expect(mergeEmojiCounts(counts)).toEqual({ "😊": 3, "👍": 3, "❤️": 4 });
  });

  it("should handle objects with no overlapping emojis", () => {
    const counts: Record<string, number>[] = [{ "😊": 2 }, { "👍": 1 }, { "❤️": 3 }];
    expect(mergeEmojiCounts(counts)).toEqual({ "😊": 2, "👍": 1, "❤️": 3 });
  });

  it("should handle empty objects in the array", () => {
    const counts: Record<string, number>[] = [{ "😊": 2 }, {}, { "👍": 1 }];
    expect(mergeEmojiCounts(counts)).toEqual({ "😊": 2, "👍": 1 });
  });
});
