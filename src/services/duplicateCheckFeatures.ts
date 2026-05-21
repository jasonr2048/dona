import { Conversation } from "@models/processed";

import { computeConversationHash, shouldHashConversation } from "@/services/conversationHash";

export interface DuplicateCheckFeature {
  conversationHash: string;
  dataSource: string;
  conversationPseudonym: string;
  textMessages: number;
  audioMessages: number;
  totalMessages: number;
  minTimestamp: number | null;
  maxTimestamp: number | null;
}

function quoteCsv(value: string | number | null): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function collectDuplicateCheckFeatures(conversations: Conversation[], minMessages: number): DuplicateCheckFeature[] {
  return conversations
    .map(conversation => {
      if (!shouldHashConversation(conversation, minMessages)) {
        return null;
      }

      const hash = conversation.conversationHash || computeConversationHash(conversation);
      if (!hash) {
        return null;
      }

      const timestamps = [
        ...(conversation.messages || []).map(message => message.timestamp),
        ...(conversation.messagesAudio || []).map(message => message.timestamp)
      ];
      const textMessages = conversation.messages?.length || 0;
      const audioMessages = conversation.messagesAudio?.length || 0;

      return {
        conversationHash: hash,
        dataSource: conversation.dataSource,
        conversationPseudonym: conversation.conversationPseudonym,
        textMessages,
        audioMessages,
        totalMessages: textMessages + audioMessages,
        minTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
        maxTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null
      };
    })
    .filter((feature): feature is DuplicateCheckFeature => feature !== null);
}

export function duplicateCheckFeaturesToCsv(features: DuplicateCheckFeature[]): string {
  const header = [
    "conversationHash",
    "dataSource",
    "conversationPseudonym",
    "textMessages",
    "audioMessages",
    "totalMessages",
    "minTimestamp",
    "maxTimestamp"
  ].join(",");

  const rows = features.map(feature =>
    [
      quoteCsv(feature.conversationHash),
      quoteCsv(feature.dataSource),
      quoteCsv(feature.conversationPseudonym),
      quoteCsv(feature.textMessages),
      quoteCsv(feature.audioMessages),
      quoteCsv(feature.totalMessages),
      quoteCsv(feature.minTimestamp),
      quoteCsv(feature.maxTimestamp)
    ].join(",")
  );

  return [header, ...rows].join("\n");
}
