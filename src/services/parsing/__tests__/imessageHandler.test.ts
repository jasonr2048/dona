import { describe, expect, it } from "@jest/globals";
import initSqlJs from "sql.js";

import { DataSourceValue } from "@models/processed";
import handleImessageDBFiles from "@services/parsing/imessage/imessageHandler";
import { SqlJsAdapter } from "@services/parsing/imessage/sqlJsAdapter";
import { DonationErrors } from "@services/errors";

// Mock aliasConfig to avoid next-intl dependency
jest.mock("@services/parsing/shared/aliasConfig", () => require("@services/__mocks__/aliasConfigMock"));
// Mock waSQLiteAdapter to avoid importing wa-sqlite ES modules in tests
jest.mock("@services/parsing/imessage/waSqliteAdapter", () => ({
  WaSQLiteAdapter: jest.fn()
}));

describe("iMessage Handler", () => {
  describe("File selection validation", () => {
    it("should reject multiple database files", async () => {
      const file1 = new File([], "chat1.db");
      const file2 = new File([], "chat2.db");

      await expect(handleImessageDBFiles([file1, file2])).rejects.toMatchObject({
        message: DonationErrors.NotSingleDBFile
      });
    });

    it("should reject empty file array", async () => {
      await expect(handleImessageDBFiles([])).rejects.toMatchObject({
        message: DonationErrors.NotSingleDBFile
      });
    });
  });

  describe("Fixture tests w/ mock DB", () => {
    describe("Simple parsing", () => {
      async function createMockDBFile(): Promise<File> {
        const SQL = await initSqlJs();
        const db = new SQL.Database();

        // Create the schema that matches the actual iMessage database structure
        db.run(`
        CREATE TABLE message (
          ROWID INTEGER PRIMARY KEY,
          text TEXT,
          date INTEGER,
          handle_id INTEGER,
          is_from_me INTEGER,
          is_audio_message INTEGER,
          error INTEGER
        );
        
        CREATE TABLE chat (
          ROWID INTEGER PRIMARY KEY,
          group_id TEXT,
          display_name TEXT,
          room_name TEXT
        );
        
        CREATE TABLE chat_message_join (
          chat_id INTEGER,
          message_id INTEGER
        );
        
        CREATE TABLE attachment (
          ROWID INTEGER PRIMARY KEY,
          mime_type TEXT
        );
        
        CREATE TABLE message_attachment_join (
          message_id INTEGER,
          attachment_id INTEGER
        );
      `);

        // Insert fixture data
        // Mac epoch time: nanoseconds since 2001-01-01
        // For a date in 2023, we need about 22 years worth of nanoseconds
        const yearsSince2001 = 22;
        const nanosecondsPerYear = 365.25 * 24 * 60 * 60 * 1e9;
        const testTimestamp1 = Math.floor(yearsSince2001 * nanosecondsPerYear);
        const testTimestamp2 = Math.floor((yearsSince2001 + 0.001) * nanosecondsPerYear);

        // Insert a chat
        db.run(`INSERT INTO chat (ROWID, group_id, display_name) VALUES (1, 'chat-123', 'Test Chat')`);

        // Insert messages - one from donor (is_from_me=1) and one from contact
        db.run(`
        INSERT INTO message (ROWID, text, date, handle_id, is_from_me, is_audio_message, error)
        VALUES 
          (1, 'Hello from donor', ${testTimestamp1}, 1, 1, 0, 0),
          (2, 'Hello from contact', ${testTimestamp2}, 2, 0, 0, 0)
      `);

        // Link messages to chat
        db.run(`
        INSERT INTO chat_message_join (chat_id, message_id)
        VALUES (1, 1), (1, 2)
      `);

        // Export database to bytes
        const data = db.export();
        const buffer = new Uint8Array(data);
        db.close();

        return new File([buffer], "test.db", { type: "application/x-sqlite3" });
      }

      it("should parse messages from mocked database", async () => {
        const mockFile = await createMockDBFile();
        const adapter = new SqlJsAdapter();
        const result = await handleImessageDBFiles([mockFile], adapter);

        expect(result).toBeDefined();
        expect(result.anonymizedConversations).toBeDefined();
        expect(result.anonymizedConversations.length).toBeGreaterThan(0);
      });

      it("should convert Mac epoch timestamps correctly", async () => {
        const mockFile = await createMockDBFile();
        const adapter = new SqlJsAdapter();
        const result = await handleImessageDBFiles([mockFile], adapter);

        const conversation = result.anonymizedConversations[0];
        expect(conversation.messages.length).toBeGreaterThan(0);

        const message = conversation.messages[0];
        const messageDate = new Date(message.timestamp);

        // Should be a realistic date (after 2020)
        expect(messageDate.getFullYear()).toBeGreaterThanOrEqual(2020);
      });

      it("should detect donor via is_from_me flag", async () => {
        const mockFile = await createMockDBFile();
        const adapter = new SqlJsAdapter();
        const result = await handleImessageDBFiles([mockFile], adapter);

        // Should have detected a donor name from is_from_me messages
        expect(result.participantNamesToPseudonyms).toBeDefined();
        expect(Object.keys(result.participantNamesToPseudonyms).length).toBeGreaterThan(0);
      });

      it("should set dataSource to IMessage", async () => {
        const mockFile = await createMockDBFile();
        const adapter = new SqlJsAdapter();
        const result = await handleImessageDBFiles([mockFile], adapter);

        const conversation = result.anonymizedConversations[0];
        expect(conversation.dataSource).toBe(DataSourceValue.IMessage);
      });

      it("should aggregate participants correctly", async () => {
        const mockFile = await createMockDBFile();
        const adapter = new SqlJsAdapter();
        const result = await handleImessageDBFiles([mockFile], adapter);

        const conversation = result.anonymizedConversations[0];
        expect(conversation.participants).toBeDefined();
        expect(conversation.participants.length).toBeGreaterThan(0);
      });
    });

    describe("Edge cases", () => {
      it("should handle group chats correctly", async () => {
        const SQL = await initSqlJs();
        const db = new SQL.Database();

        db.run(`
        CREATE TABLE message (ROWID INTEGER PRIMARY KEY, text TEXT, date INTEGER, handle_id INTEGER, is_from_me INTEGER, is_audio_message INTEGER, error INTEGER);
        CREATE TABLE chat (ROWID INTEGER PRIMARY KEY, group_id TEXT, display_name TEXT, room_name TEXT);
        CREATE TABLE chat_message_join (chat_id INTEGER, message_id INTEGER);
        CREATE TABLE attachment (ROWID INTEGER PRIMARY KEY, mime_type TEXT);
        CREATE TABLE message_attachment_join (message_id INTEGER, attachment_id INTEGER);
      `);

        const testTimestamp = Math.floor(22 * 365.25 * 24 * 60 * 60 * 1e9);

        // Create a group chat with multiple participants
        db.run(`INSERT INTO chat (ROWID, group_id, display_name) VALUES (1, 'group-456', 'Group Chat')`);
        db.run(`
        INSERT INTO message (ROWID, text, date, handle_id, is_from_me, is_audio_message, error)
        VALUES 
          (1, 'Message 1', ${testTimestamp}, 1, 1, 0, 0),
          (2, 'Message 2', ${testTimestamp}, 2, 0, 0, 0),
          (3, 'Message 3', ${testTimestamp}, 3, 0, 0, 0)
      `);
        db.run(`INSERT INTO chat_message_join (chat_id, message_id) VALUES (1, 1), (1, 2), (1, 3);`);

        const data = db.export();
        const buffer = new Uint8Array(data);
        db.close();

        const mockFile = new File([buffer], "group.db", { type: "application/x-sqlite3" });
        const adapter = new SqlJsAdapter();
        const result = await handleImessageDBFiles([mockFile], adapter);

        const conversation = result.anonymizedConversations[0];
        expect(conversation.isGroupConversation).toBe(true);
        expect(conversation.participants.length).toBeGreaterThan(2);
      });

      it("should handle audio messages", async () => {
        const SQL = await initSqlJs();
        const db = new SQL.Database();

        db.run(`
        CREATE TABLE message (ROWID INTEGER PRIMARY KEY, text TEXT, date INTEGER, handle_id INTEGER, is_from_me INTEGER, is_audio_message INTEGER, error INTEGER);
        CREATE TABLE chat (ROWID INTEGER PRIMARY KEY, group_id TEXT, display_name TEXT, room_name TEXT);
        CREATE TABLE chat_message_join (chat_id INTEGER, message_id INTEGER);
        CREATE TABLE attachment (ROWID INTEGER PRIMARY KEY, mime_type TEXT);
        CREATE TABLE message_attachment_join (message_id INTEGER, attachment_id INTEGER);
      `);

        const testTimestamp = Math.floor(22 * 365.25 * 24 * 60 * 60 * 1e9);

        db.run(`INSERT INTO chat (ROWID, group_id) VALUES (1, 'chat-789')`);
        db.run(`
        INSERT INTO message (ROWID, text, date, handle_id, is_from_me, is_audio_message, error)
        VALUES (1, '', ${testTimestamp}, 1, 1, 1, 0)
      `);
        db.run(`INSERT INTO chat_message_join (chat_id, message_id) VALUES (1, 1)`);

        const data = db.export();
        const buffer = new Uint8Array(data);
        db.close();

        const mockFile = new File([buffer], "audio.db", { type: "application/x-sqlite3" });
        const adapter = new SqlJsAdapter();
        const result = await handleImessageDBFiles([mockFile], adapter);

        const conversation = result.anonymizedConversations[0];
        expect(conversation.messagesAudio.length).toBeGreaterThan(0);
        expect(conversation.messagesAudio[0].lengthSeconds).toBe(0); // iMessage doesn't calculate audio length
      });
    });
  });
});
