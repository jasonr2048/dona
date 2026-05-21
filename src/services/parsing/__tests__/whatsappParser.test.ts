import { describe, it, expect } from "@jest/globals";
import { makeArrayOfMessages, parseMessages } from "@services/parsing/whatsapp/whatsappParser";

// Mock aliasConfig to avoid next-intl dependency
jest.mock("@services/parsing/shared/aliasConfig", () => require("@services/__mocks__/aliasConfigMock"));

describe("WhatsApp Parser", () => {
  describe("makeArrayOfMessages", () => {
    it("should handle single line messages", () => {
      const lines = ["01/12/2023, 10:30 - Alice: Hello", "01/12/2023, 10:31 - Bob: Hi there"];
      const result = makeArrayOfMessages(lines);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe("01/12/2023, 10:30 - Alice: Hello");
      expect(result[1]).toBe("01/12/2023, 10:31 - Bob: Hi there");
    });

    it("should handle multiline messages by concatenating continuation lines", () => {
      const lines = [
        "01/12/2023, 10:30 - Alice: This is a long message",
        "that continues on the next line",
        "and another line",
        "01/12/2023, 10:31 - Bob: Short reply"
      ];
      const result = makeArrayOfMessages(lines);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(
        "01/12/2023, 10:30 - Alice: This is a long message\nthat continues on the next line\nand another line"
      );
      expect(result[1]).toBe("01/12/2023, 10:31 - Bob: Short reply");
    });

    it("should handle messages with newlines in the middle", () => {
      const lines = [
        "15/06/2023, 14:22 - John: First line",
        "Second line of same message",
        "Third line",
        "15/06/2023, 14:25 - Jane: Another message"
      ];
      const result = makeArrayOfMessages(lines);
      expect(result).toHaveLength(2);
      expect(result[0]).toContain("First line\nSecond line of same message\nThird line");
      expect(result[1]).toBe("15/06/2023, 14:25 - Jane: Another message");
    });

    it("should skip empty lines at the start", () => {
      const lines = ["", "Some non-message line", "01/12/2023, 10:30 - Alice: First real message"];
      const result = makeArrayOfMessages(lines);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("01/12/2023, 10:30 - Alice: First real message");
    });

    it("should handle system messages (lines without author)", () => {
      const lines = [
        "01/12/2023, 10:30 - Alice joined",
        "01/12/2023, 10:31 - Bob: Welcome!",
        "01/12/2023, 10:32 - Security code changed"
      ];
      const result = makeArrayOfMessages(lines);
      // System messages don't have the "Author:" pattern, so they should be treated as continuation or standalone
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("parseMessages", () => {
    it("should parse messages with multiple participants", () => {
      const messages = [
        "01/12/2023, 10:30 - Alice: Hello everyone",
        "01/12/2023, 10:31 - Bob: Hi Alice!",
        "01/12/2023, 10:32 - Charlie: Good morning",
        "01/12/2023, 10:33 - Alice: How are you all?"
      ];
      const result = parseMessages(messages);

      expect(result.texts).toHaveLength(4);
      expect(result.contacts).toContain("Alice");
      expect(result.contacts).toContain("Bob");
      expect(result.contacts).toContain("Charlie");
      expect(result.contacts).toHaveLength(3); // Unique participants
    });

    it("should parse date and time correctly", () => {
      const messages = ["01/12/2023, 10:30 - Alice: Test message"];
      const result = parseMessages(messages);

      expect(result.texts).toHaveLength(1);
      expect(result.texts[0].date).toBeGreaterThan(0); // Timestamp should be positive
      expect(result.texts[0].author).toBe("Alice");
      expect(result.texts[0].message).toBe("Test message");
    });

    it("should parse messages with AM/PM format", () => {
      const messages = ["12/01/2023, 2:30 PM - Alice: Afternoon message", "12/01/2023, 9:45 AM - Bob: Morning message"];
      const result = parseMessages(messages);

      expect(result.texts).toHaveLength(2);
      expect(result.texts[0].author).toBe("Alice");
      expect(result.texts[1].author).toBe("Bob");
    });

    it("should handle different date separators", () => {
      const messagesWithSlash = ["01/12/2023, 10:30 - Alice: Message 1"];
      const messagesWithDash = ["01-12-2023, 10:30 - Alice: Message 2"];
      const messagesWithDot = ["01.12.2023, 10:30 - Alice: Message 3"];

      const result1 = parseMessages(messagesWithSlash);
      const result2 = parseMessages(messagesWithDash);
      const result3 = parseMessages(messagesWithDot);

      expect(result1.texts).toHaveLength(1);
      expect(result2.texts).toHaveLength(1);
      expect(result3.texts).toHaveLength(1);
    });

    it("should extract all unique contact names", () => {
      const messages = [
        "01/12/2023, 10:30 - Alice: Message 1",
        "01/12/2023, 10:31 - Bob: Message 2",
        "01/12/2023, 10:32 - Alice: Message 3",
        "01/12/2023, 10:33 - Charlie: Message 4",
        "01/12/2023, 10:34 - Bob: Message 5"
      ];
      const result = parseMessages(messages);

      expect(result.contacts).toHaveLength(3);
      expect(result.contacts).toContain("Alice");
      expect(result.contacts).toContain("Bob");
      expect(result.contacts).toContain("Charlie");
    });

    it("should handle system messages without author", () => {
      const messages = [
        "01/12/2023, 10:30 - Alice: Hello",
        "01/12/2023, 10:31 - Messages and calls are end-to-end encrypted",
        "01/12/2023, 10:32 - Bob: Hi"
      ];
      const result = parseMessages(messages);

      // System messages should still be parsed
      expect(result.texts.length).toBeGreaterThanOrEqual(2);
      // But shouldn't add to contacts
      expect(result.contacts).toHaveLength(2);
      expect(result.contacts).toContain("Alice");
      expect(result.contacts).toContain("Bob");
    });

    it("should handle empty message array", () => {
      const result = parseMessages([]);

      expect(result.texts).toEqual([]);
      expect(result.contacts).toEqual([]);
    });

    it("should parse messages with colons in the message text", () => {
      const messages = ["01/12/2023, 10:30 - Alice: Meeting at 3:00 PM: Don't forget!"];
      const result = parseMessages(messages);

      expect(result.texts).toHaveLength(1);
      expect(result.texts[0].message).toBe("Meeting at 3:00 PM: Don't forget!");
    });

    it("should handle messages with brackets in timestamp", () => {
      const messages = ["[01/12/2023, 10:30] - Alice: Message with brackets"];
      const result = parseMessages(messages);

      expect(result.texts).toHaveLength(1);
      expect(result.texts[0].author).toBe("Alice");
    });
  });

  describe("makeArrayOfMessages + parseMessages integration", () => {
    it("should correctly process multiline messages from multiple participants", () => {
      const lines = [
        "15/06/2023, 09:00 - Alice: Good morning team!",
        "Let's discuss today's agenda:",
        "1. Project updates",
        "2. Budget review",
        "15/06/2023, 09:05 - Bob: Thanks Alice!",
        "I'll prepare the budget numbers",
        "15/06/2023, 09:10 - Charlie: Great, I have project updates ready",
        "15/06/2023, 09:15 - Alice: Perfect!"
      ];

      const messages = makeArrayOfMessages(lines);
      const result = parseMessages(messages);

      expect(result.texts).toHaveLength(4);
      expect(result.contacts).toHaveLength(3);
      expect(result.contacts).toContain("Alice");
      expect(result.contacts).toContain("Bob");
      expect(result.contacts).toContain("Charlie");

      // First message should contain all the multiline content
      expect(result.texts[0].message).toContain("Good morning team!");
      expect(result.texts[0].message).toContain("1. Project updates");
      expect(result.texts[0].message).toContain("2. Budget review");

      // Second message should also be multiline
      expect(result.texts[1].message).toContain("Thanks Alice!");
      expect(result.texts[1].message).toContain("I'll prepare the budget numbers");
    });

    it("should handle a realistic group chat with multiline and multiple participants", () => {
      const lines = [
        "20/11/2023, 14:30 - Alice: Hey everyone! 👋",
        "20/11/2023, 14:31 - Bob: Hi Alice!",
        "20/11/2023, 14:32 - Charlie: Hello! What's up?",
        "20/11/2023, 14:33 - Alice: I wanted to share the meeting notes:",
        "- Action item 1: Review the proposal",
        "- Action item 2: Schedule follow-up",
        "- Action item 3: Send updates to the team",
        "20/11/2023, 14:35 - Bob: Got it, thanks!",
        "20/11/2023, 14:36 - Charlie: I'll handle action item 2",
        "20/11/2023, 14:37 - Alice: Awesome, thanks Charlie!",
        "20/11/2023, 14:40 - Bob: I can take care of item 1",
        "Let me know if you need anything else"
      ];

      const messages = makeArrayOfMessages(lines);
      const result = parseMessages(messages);

      // Should have 8 messages total (counted from the lines above)
      expect(result.texts).toHaveLength(8);

      // Should have 3 unique participants
      expect(result.contacts).toHaveLength(3);
      expect(new Set(result.contacts).size).toBe(3);

      // Alice's multiline message should be properly merged
      const aliceMultilineMsg = result.texts.find(
        msg => msg.author === "Alice" && msg.message.includes("meeting notes")
      );
      expect(aliceMultilineMsg).toBeDefined();
      expect(aliceMultilineMsg!.message).toContain("Action item 1");
      expect(aliceMultilineMsg!.message).toContain("Action item 2");
      expect(aliceMultilineMsg!.message).toContain("Action item 3");

      // Bob's multiline message should also be merged
      const bobMultilineMsg = result.texts.find(
        msg => msg.author === "Bob" && msg.message.includes("take care of item 1")
      );
      expect(bobMultilineMsg).toBeDefined();
      expect(bobMultilineMsg!.message).toContain("Let me know if you need anything else");
    });
  });
});
