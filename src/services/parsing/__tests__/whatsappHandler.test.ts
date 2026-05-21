import deIdentify from "@services/parsing/whatsapp/deIdentify";
import { describe, expect, it } from "@jest/globals";
import handleWhatsappTxtFiles, { determineDonorName } from "@services/parsing/whatsapp/whatsappHandler";
import { DonationErrors } from "@services/errors";
import { CONFIG } from "@/config";
import "@services/__mocks__/FileReader";

jest.mock("@services/parsing/whatsapp/deIdentify", () => require("@services/parsing/__mocks__/whatsappDeIdentifyMock"));
jest.mock("@services/parsing/shared/aliasConfig", () => require("@services/__mocks__/aliasConfigMock"));

function createMockTxtFile(content: string, name = "chat.txt"): File {
  return new File([content], name, { type: "text/plain" });
}

describe("WhatsApp Handler", () => {
  describe("File selection validation", () => {
    it("should reject empty file array", async () => {
      await expect(handleWhatsappTxtFiles([])).rejects.toMatchObject({
        message: DonationErrors.TooFewChats
      });
    });

    it("should reject too few chats (only one file)", async () => {
      await expect(handleWhatsappTxtFiles([new File([], "chat.txt")])).rejects.toMatchObject({
        message: DonationErrors.TooFewChats
      });
    });
  });

  describe("Fixture tests", () => {
    it("should reject when all files are the same and meet min chat count", async () => {
      const fileContent = "01/12/2023, 10:30 - Alice: Hello";
      const files = Array.from({ length: CONFIG.MIN_CHATS_FOR_DONATION }, (_, i) =>
        createMockTxtFile(fileContent, `chat${i + 1}.txt`)
      );
      await expect(handleWhatsappTxtFiles(files)).rejects.toMatchObject({
        message: DonationErrors.SameFiles
      });
    });

    it("should reject if donor name cannot be determined due to only system messages", async () => {
      // Each chat contains only system messages, but different number of times for uniqueness
      const files = Array.from({ length: CONFIG.MIN_CHATS_FOR_DONATION }, (_, i) => {
        const systemMsg = `01/12/2023, 10:32 - Messages and calls are end-to-end encrypted\n`;
        const content = systemMsg.repeat(i + 1); // Repeat to vary file size
        return createMockTxtFile(content, `chat${i + 1}.txt`);
      });

      await expect(handleWhatsappTxtFiles(files)).rejects.toMatchObject({
        message: DonationErrors.NoDonorNameFound
      });
    });

    it("should handle multiline and system messages in integration with enough chats", async () => {
      const chat1 = [
        "01/12/2023, 10:30 - Alice: This is a long message",
        "that continues on the next line",
        "01/12/2023, 10:31 - Bob: Hi Alice",
        "01/12/2023, 10:32 - Messages and calls are end-to-end encrypted"
      ].join("\n");
      const chat2 = ["02/12/2023, 11:00 - Alice: Another message", "02/12/2023, 11:01 - Charlie: Reply"].join("\n");
      // Fill up to min chats, alternating chat1 and chat2
      const files = Array.from({ length: CONFIG.MIN_CHATS_FOR_DONATION }, (_, i) =>
        createMockTxtFile(i % 2 === 0 ? chat1 : chat2, `chat${i + 1}.txt`)
      );

      await handleWhatsappTxtFiles(files);

      // Check deIdentify was called once
      expect(deIdentify).toHaveBeenCalledTimes(1);

      // Get the parsedConversations argument
      const [parsedConversations, donorName] = (deIdentify as jest.Mock).mock.calls[0];

      // Check the number of conversations matches
      expect(parsedConversations.length).toBe(CONFIG.MIN_CHATS_FOR_DONATION);

      // Check the first conversation's messages
      expect(parsedConversations[0].length).toBe(3); // Should be 3 messages: Alice multiline, Bob, system

      // Check the content of the first message (multiline)
      expect(parsedConversations[0][0].message).toContain("This is a long message");
      expect(parsedConversations[0][0].message).toContain("that continues on the next line");
    });
  });

  describe("determineDonorName", () => {
    it("returns the single name present in all chats", () => {
      const contacts = [
        ["Alice", "Bob"],
        ["Alice", "Charlie"],
        ["Alice", "David"]
      ];
      expect(determineDonorName(contacts)).toBe("Alice");
    });

    it("returns the most frequent name if no intersection", () => {
      const contacts = [
        ["Bob", "Charlie"],
        ["Alice", "Charlie"],
        ["Charlie", "David"]
      ];
      expect(determineDonorName(contacts)).toBe("Charlie");
    });

    it("returns undefined if no contacts", () => {
      expect(determineDonorName([[], []])).toBeUndefined();
    });

    it("returns undefined if no common or frequent name", () => {
      const contacts = [["Alice"], ["Bob"], ["Charlie"]];
      expect(determineDonorName(contacts)).toBe("Alice"); // All have count 1, returns first by sort
    });

    it("returns undefined for empty input", () => {
      expect(determineDonorName([])).toBeUndefined();
    });
  });
});
