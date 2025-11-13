import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import handleImessageDBFiles from "@services/parsing/imessage/imessageHandler";
import { describe, expect, it } from "@jest/globals";
import { Conversation } from "@models/processed";

async function createMockFile(): Promise<File> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create tables and insert test data
  db.run(`
        CREATE TABLE handle (rowid INTEGER PRIMARY KEY, id TEXT);
        CREATE TABLE message (rowid INTEGER PRIMARY KEY, text TEXT, date INTEGER, handle_id INTEGER);
        CREATE TABLE chat (rowid INTEGER PRIMARY KEY, chat_identifier TEXT);
        CREATE TABLE chat_message_join (chat_id INTEGER, message_id INTEGER);
    `);

  db.run(`
        INSERT INTO handle (id) VALUES ('+1234567890');
        INSERT INTO message (text, date, handle_id) VALUES ('Hello world', 1620000000000000, 1);
        INSERT INTO chat (chat_identifier) VALUES ('chat1');
        INSERT INTO chat_message_join (chat_id, message_id) VALUES (1, 1);
    `);

  // Convert the database to a Uint8Array
  const data = db.export();
  const buffer = new Uint8Array(data);

  // Create a mock File object
  const file = new File([buffer], "test.sqlite", { type: "application/x-sqlite3" });

  db.close();
  return file;
}

async function createFileFromPath(
  filePath: string,
  fileName: string,
  fileType: string
): Promise<File> {
  const fileBuffer = fs.readFileSync(filePath);
  return new File([fileBuffer], fileName, { type: fileType });
}

function computeConversationStats(conversations: Conversation[]) {
  const conversationStats = new Map<
    string,
    { participants: number; messages: number; audioMessages: number }
  >();
  conversations.forEach((conversation) => {
    if (conversation.id != null) {
      conversationStats.set(conversation.id, {
        participants: new Set(conversation.participants).size,
        messages: conversation.messages.length,
        audioMessages: conversation.messagesAudio.length,
      });
    }
  });
  return conversationStats;
}

describe("handleImessageDBFiles", () => {
  it("should process the mock iMessage DB file correctly", async () => {
    const mockFile = await createMockFile();
    const result = await handleImessageDBFiles([mockFile]);
    // Add your assertions here based on the expected result
    expect(result).toBeDefined();

    const conversationStats = computeConversationStats(result.anonymizedConversations);
  });

  it("should process a real anonymised iMessage DB file correctly", async () => {
    const filePath = path.resolve(__dirname, "../../../test_data/chat.db");
    const file = await createFileFromPath(filePath, "chat.db", "application/x-sqlite3");
    const result = await handleImessageDBFiles([file]);
    // Add your assertions here based on the expected result
    expect(result).toBeDefined();

    const conversationStats = computeConversationStats(result.anonymizedConversations);

    // Check the number of distinct conversation IDs
    expect(conversationStats.size).toBe(30);

    // Check the specific statistics for each conversation
    const expectedStats = new Map([
      ["436C77E7-8C44-4EB6-9246-0D02464767EA", { participants: 2, messages: 12, audioMessages: 0 }],
      ["600B6B93-FAB1-4E9D-89F2-27BD64CDB15A", { participants: 2, messages: 6, audioMessages: 0 }],
      ["EA3B8519-D9DA-47C8-BEA3-C0A961EF9D2F", { participants: 2, messages: 23, audioMessages: 0 }],
      [
        "0DA8A323-202B-4F6E-A40C-D11455A3AFC6",
        { participants: 2, messages: 639, audioMessages: 0 },
      ],
      [
        "6BE73549-9390-4DAD-A5CB-FDEC37C12B29",
        { participants: 2, messages: 124, audioMessages: 0 },
      ],
      ["8D4D31EA-0399-4706-9F4F-9797EE208C70", { participants: 2, messages: 44, audioMessages: 0 }],
      ["39FCC59C-B41F-4487-8EB9-6D844B6BA8BE", { participants: 2, messages: 11, audioMessages: 0 }],
      ["9658FBDA-656D-4A66-A481-806852FDB8F8", { participants: 1, messages: 4, audioMessages: 0 }],
      ["40951F0D-1258-437C-AFCC-871032744348", { participants: 1, messages: 2, audioMessages: 0 }],
      [
        "048174A8-90A1-45C9-9EEF-57E091B9133E",
        { participants: 2, messages: 938, audioMessages: 0 },
      ],
      ["DA2DC1DD-B525-40EC-AD83-3D4951728EF4", { participants: 3, messages: 19, audioMessages: 0 }],
      [
        "B0A369EA-DEE2-4CF2-8B32-48F6C3CC1C3B",
        { participants: 2, messages: 193, audioMessages: 0 },
      ],
      ["680DF903-7446-4784-8656-D621432B122B", { participants: 2, messages: 9, audioMessages: 0 }],
      ["CCD64DDE-9FD6-4719-94D6-E9F742C1F501", { participants: 1, messages: 2, audioMessages: 0 }],
      ["78ABACD4-90F4-493A-B6B3-654C543FD909", { participants: 2, messages: 13, audioMessages: 0 }],
      ["54FA1764-0B45-45F9-A72E-3DFEE5F02AD8", { participants: 4, messages: 10, audioMessages: 0 }],
      ["2A171D68-3307-47DE-9484-B7BED78BF86E", { participants: 4, messages: 19, audioMessages: 0 }],
      ["F65C103A-7814-433F-9679-92422699C14A", { participants: 5, messages: 10, audioMessages: 0 }],
      ["6169FC84-DC4A-4441-A625-2875544B41B9", { participants: 3, messages: 63, audioMessages: 0 }],
      ["C361B7C7-3030-49C9-BF1D-E9A963902041", { participants: 1, messages: 1, audioMessages: 0 }],
      ["7D669744-2A6A-4EE4-99D3-FAFE907577FD", { participants: 2, messages: 54, audioMessages: 0 }],
      ["61C271EE-67C7-43B4-AD2E-BF7369F0A7B3", { participants: 2, messages: 8, audioMessages: 0 }],
      ["74DF5C2F-E7C5-4ECD-A306-C10E0C6EF32D", { participants: 4, messages: 20, audioMessages: 0 }],
      ["832787E7-1C54-451D-B88C-064554E527AC", { participants: 2, messages: 6, audioMessages: 0 }],
      ["FAEB8658-B380-4378-A8BB-79CDD565F25B", { participants: 1, messages: 1, audioMessages: 0 }],
      ["F18863EB-277C-44AB-B670-00EA047DDE8C", { participants: 1, messages: 1, audioMessages: 0 }],
      ["F6E2BCA1-C570-43B6-8142-DF2AA74B13B7", { participants: 1, messages: 1, audioMessages: 0 }],
      ["C9B1DBDD-C728-4771-8F93-F000BFB8E64F", { participants: 1, messages: 4, audioMessages: 0 }],
      ["A107A095-0E0D-4C4D-9C2B-270762ED9F2E", { participants: 1, messages: 1, audioMessages: 0 }],
      ["609486F6-284F-4847-8756-14028C46DA37", { participants: 2, messages: 18, audioMessages: 0 }],
    ]);

    expectedStats.forEach((value, key) => {
      expect(conversationStats.get(key)).toEqual(value);
    });
  });
});
