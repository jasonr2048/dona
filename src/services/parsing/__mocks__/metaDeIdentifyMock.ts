import { AnonymizationResult, DataSourceValue } from "@models/processed";
import { ParsedConversation } from "@services/parsing/meta/metaHandlers";
import { ValidEntry } from "@services/parsing/shared/zipExtraction";

export default jest.fn(
  (
    parsedConversations: ParsedConversation[],
    audioEntries: ValidEntry[],
    donorName: string,
    dataSourceValue: DataSourceValue
  ): Promise<AnonymizationResult> =>
    Promise.resolve({
      anonymizedConversations: parsedConversations.map((conv, idx) => ({
        messages: conv.messages.map((msg, msgIdx) => ({
          id: `mock_message_${idx}_${msgIdx}`,
          wordCount: msg.content ? msg.content.split(" ").length : 0,
          emojiCounts: undefined,
          timestamp: msg.timestamp_ms,
          sender: `Pseudonym${msgIdx + 1}`
        })),
        participants: conv.participants.map((p, pIdx) => `Pseudonym${pIdx + 1}`),
        conversationPseudonym: `deidentified chat ${idx + 1}`,
        messagesAudio: [],
        isGroupConversation: conv.participants.length > 2,
        dataSource: dataSourceValue,
        id: `mock_chat_${idx + 1}`
      })),
      participantNamesToPseudonyms: { [donorName]: "Donor" },
      chatMappingToShow: new Map<string, string[]>()
    })
);
