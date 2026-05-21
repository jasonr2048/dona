import { beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import path from "path";
import { DataSourceValue } from "@models/processed";
import { handleInstagramZipFiles } from "@services/parsing/meta/metaHandlers";
import deIdentify from "@services/parsing/meta/deIdentify";

// Mock aliasConfig to avoid next-intl dependency
jest.mock("@services/parsing/shared/aliasConfig", () => require("@services/__mocks__/aliasConfigMock"));
// Mock deIdentify
jest.mock("@services/parsing/meta/deIdentify", () => require("@services/parsing/__mocks__/metaDeIdentifyMock"));

describe("Instagram Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("File selection validation", () => {
    it("should reject empty file array", async () => {
      await expect(handleInstagramZipFiles([])).rejects.toMatchObject({
        message: expect.stringMatching(/NoProfile|NoMessageEntries/)
      });
    });
  });

  describe("Fixture tests with real Instagram export", () => {
    it("should parse valid Instagram export fixture", async () => {
      const fixturePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "test_data",
        "instagram",
        "artificial_instagram_export_valid.zip"
      );

      if (!fs.existsSync(fixturePath)) {
        console.warn(`Fixture not found: ${fixturePath}`);
        return;
      }

      const zipBuffer = fs.readFileSync(fixturePath);
      const zipFile = new File([zipBuffer], "instagram_export.zip", { type: "application/zip" });

      const result = await handleInstagramZipFiles([zipFile]);

      // Verify deIdentify was called
      expect(deIdentify).toHaveBeenCalledTimes(1);

      const [parsedConversations, audioEntries, donorName, dataSource] = (deIdentify as jest.Mock).mock.calls[0];

      // Check that conversations were parsed
      expect(Array.isArray(parsedConversations)).toBe(true);
      expect(parsedConversations.length).toBeGreaterThan(0);

      // Check donor name was extracted
      expect(typeof donorName).toBe("string");
      expect(donorName.length).toBeGreaterThan(0);
      expect(donorName).toBe("Caleb Gonzalez"); // From the fixture

      // Check data source
      expect(dataSource).toBe(DataSourceValue.Instagram);

      // Check audio entries
      expect(Array.isArray(audioEntries)).toBe(true);

      // Verify result structure
      expect(result).toHaveProperty("anonymizedConversations");
      expect(result).toHaveProperty("participantNamesToPseudonyms");
      expect(result).toHaveProperty("chatMappingToShow");
    });

    it("should parse conversations with correct structure", async () => {
      const fixturePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "test_data",
        "instagram",
        "artificial_instagram_export_valid.zip"
      );

      if (!fs.existsSync(fixturePath)) {
        console.warn(`Fixture not found: ${fixturePath}`);
        return;
      }

      const zipBuffer = fs.readFileSync(fixturePath);
      const zipFile = new File([zipBuffer], "instagram_export.zip", { type: "application/zip" });

      await handleInstagramZipFiles([zipFile]);

      const [parsedConversations] = (deIdentify as jest.Mock).mock.calls[0];

      // Verify conversation structure
      expect(parsedConversations.length).toBeGreaterThan(0);

      const firstConversation = parsedConversations[0];
      expect(firstConversation).toHaveProperty("participants");
      expect(firstConversation).toHaveProperty("messages");
      expect(Array.isArray(firstConversation.participants)).toBe(true);
      expect(Array.isArray(firstConversation.messages)).toBe(true);

      // Check participants have names
      if (firstConversation.participants.length > 0) {
        expect(firstConversation.participants[0]).toHaveProperty("name");
      }

      // Check messages have required fields
      if (firstConversation.messages.length > 0) {
        const firstMessage = firstConversation.messages[0];
        expect(firstMessage).toHaveProperty("sender_name");
        expect(firstMessage).toHaveProperty("timestamp_ms");
      }
    });

    it("should detect audio entries from fixture", async () => {
      const fixturePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "test_data",
        "instagram",
        "artificial_instagram_export_valid.zip"
      );

      if (!fs.existsSync(fixturePath)) {
        console.warn(`Fixture not found: ${fixturePath}`);
        return;
      }

      const zipBuffer = fs.readFileSync(fixturePath);
      const zipFile = new File([zipBuffer], "instagram_export.zip", { type: "application/zip" });

      await handleInstagramZipFiles([zipFile]);

      const [, audioEntries] = (deIdentify as jest.Mock).mock.calls[0];

      // The valid fixture has 12 audio files
      expect(audioEntries.length).toBeGreaterThan(0);
      expect(audioEntries.length).toBe(12);
    });
  });

  describe("Error handling", () => {
    it("should handle empty zip file", async () => {
      // Create minimal valid empty zip file
      const emptyZipBuffer = new Uint8Array([
        0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
      ]);
      const emptyZip = new File([emptyZipBuffer], "empty.zip", { type: "application/zip" });

      await expect(handleInstagramZipFiles([emptyZip])).rejects.toMatchObject({
        message: expect.stringMatching(/NoProfile|NoMessageEntries/)
      });
    });
  });
});
