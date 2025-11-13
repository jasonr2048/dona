import { Database } from "sql.js";

import {
  AnonymizationResult,
  Conversation,
  DataSourceValue,
  Message,
  MessageAudio,
} from "@/models/processed";
import { ChatPseudonyms, ContactPseudonyms } from "@/services/parsing/shared/pseudonyms";
import { getAliasConfig } from "@services/parsing/shared/aliasConfig";
import { DonationErrors, DonationValidationError } from "@services/errors";
import emojiCount from "@services/parsing/shared/emojiCount";

export default async function handleImessageDBFiles(files: File[]): Promise<AnonymizationResult> {
  if (files.length !== 1) {
    throw DonationValidationError(DonationErrors.NotSingleDBFile);
  }

  // Get data from database
  const db = await createDatabase(files[0]);
  const messages: any[] = getMessages(db);
  const groupChats: Map<string, string> = getGroupChats(db);
  db.close();

  const aliasConfig = getAliasConfig();
  let donorName = "";
  const conversationsMap = new Map<string, Conversation>();
  const contactPseudonyms = new ContactPseudonyms(aliasConfig.contactAlias);
  const chatPseudonyms = new ChatPseudonyms(
    aliasConfig.donorAlias,
    aliasConfig.chatAlias,
    DataSourceValue.IMessage
  );
  const macEpochTime = new Date("2001-01-01T00:00:00Z").getTime();

  messages.forEach((row) => {
    const timestampSinceMachEpoch = Number(row.date) / 1e6; // Convert nanoseconds to milliseconds
    const timestamp = macEpochTime + timestampSinceMachEpoch;

    const sender: string = row.handle_id?.toString() || "Unknown";

    // Set donor ID once found
    if (row.is_from_me && !donorName) {
      donorName = sender;
      chatPseudonyms.setDonorName(donorName);
      contactPseudonyms.setPseudonym(donorName, aliasConfig.donorAlias);
    }
    const conversationId = row.group_id?.toString() || "Unknown";
    const isGroupConversation = groupChats.has(conversationId);
    const isAudioMessage = Number(row.is_audio_message ?? 0) > 0;
    const isMedia = row.mime_type !== ""; // Flag for media presence, yet to be used

    const pseudonym = contactPseudonyms.getPseudonym(sender);

    // Create a new conversation if it doesn't exist
    if (!conversationsMap.has(conversationId)) {
      conversationsMap.set(conversationId, {
        id: conversationId,
        isGroupConversation,
        dataSource: DataSourceValue.IMessage,
        messages: [],
        messagesAudio: [],
        participants: [],
        conversationPseudonym: "",
      });
    }

    // Add message to the conversation
    const conversation = conversationsMap.get(conversationId);
    if (conversation) {
      if (!conversation.participants.includes(pseudonym)) {
        conversation.participants.push(pseudonym);
      }

      if (isAudioMessage) {
        conversation.messagesAudio.push({
          lengthSeconds: 0, // Not calculated for iMessage
          timestamp,
          sender: pseudonym,
        } as MessageAudio);
      } else {
        const messageText = row.text as string;
        const emojis = emojiCount(messageText);
        conversation.messages.push({
          id: row.id?.toString(),
          wordCount: messageText.split(/\s+/).length,
          emojiCounts: Object.keys(emojis).length > 0 ? emojis : undefined,
          timestamp,
          sender: pseudonym,
        } as Message);
      }
    }
  });

  // Generate conversation pseudonyms based on all participants
  conversationsMap.forEach((conversation) => {
    const participants = contactPseudonyms.getOriginalNames(conversation.participants);
    const groupName = groupChats.get(conversation.id!);
    conversation.conversationPseudonym = chatPseudonyms.getPseudonym(
      groupName ? [groupName] : participants
    );
  });

  return {
    anonymizedConversations: Array.from(conversationsMap.values()),
    participantNamesToPseudonyms: contactPseudonyms.getPseudonymMap(),
    chatMappingToShow: chatPseudonyms.getPseudonymMap(),
  };
}

async function createDatabase(file: File): Promise<Database> {
  const sqlPromise = import("sql.js/dist/sql-wasm.js");
  const SQL = await sqlPromise;
  const sqlWasm = await SQL.default({
    locateFile: (file: string) => `/sql-wasm/${file}`,
  });

  // Read the file as an ArrayBuffer
  const fileBuffer = await file.arrayBuffer();
  // Create a database using the file data
  return new sqlWasm.Database(new Uint8Array(fileBuffer));
}

// Helper function to get messages from the database
function getMessages(db: Database): any[] {
  const messages: any[] = [];
  const messagesStmt = db.prepare(`
        SELECT COALESCE(m.text, '') AS text,
               m.date,
               COALESCE(m.handle_id, 0) AS handle_id,
               COALESCE(c.group_id, '') AS group_id,
               COALESCE(c.room_name, '') AS room_name,
               COALESCE(m.is_from_me, 0) AS is_from_me,
               COALESCE(m.is_audio_message, 0) AS is_audio_message,
               COALESCE(m.error, 0) AS error,
               COALESCE(a.mime_type, '') AS mime_type
        FROM message m
                 LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
                 LEFT JOIN chat c ON cmj.chat_id = c.ROWID
                 LEFT JOIN message_attachment_join maj ON maj.message_id = m.ROWID
                 LEFT JOIN attachment a ON maj.attachment_id = a.ROWID
        WHERE m.error = 0 AND c.group_id IS NOT NULL;
    `);
  while (messagesStmt.step()) {
    const row = messagesStmt.getAsObject();
    messages.push(row);
  }
  messagesStmt.free();
  return messages;
}

// Helper function to get chat information from the database
function getGroupChats(db: Database): Map<string, string> {
  const groupChats = new Map<string, string>();
  const groupInfoStmt = db.prepare(`
        SELECT group_id, display_name
        FROM chat
        WHERE group_id IS NOT NULL;
    `);

  while (groupInfoStmt.step()) {
    const row = groupInfoStmt.getAsObject();
    groupChats.set(String(row.group_id ?? ""), String(row.display_name ?? ""));
  }
  groupInfoStmt.free();
  return groupChats;
}
