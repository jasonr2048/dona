import { AnonymizationResult, DataSourceValue, Message } from "@/models/processed";
import { ParsedMessage } from "@services/parsing/whatsapp/whatsappParser";

export default jest.fn(
  (parsedConversations: ParsedMessage[][], donorName: string): AnonymizationResult => ({
    anonymizedConversations: parsedConversations.map((texts: ParsedMessage[], idx: number) => ({
      messages: texts.map(
        (_: ParsedMessage, msgIdx: number): Message => ({
          id: `mock_message_${msgIdx + 1}`,
          wordCount: 3,
          emojiCounts: undefined,
          timestamp: Date.now(),
          sender: `Pseudonym${msgIdx + 1}`
        })
      ),
      participants: [`Pseudonym${idx + 1}`, `Pseudonym${idx + 2}`],
      conversationPseudonym: `deidentified chat ${idx + 1}`,
      messagesAudio: [],
      isGroupConversation: true,
      dataSource: DataSourceValue.WhatsApp,
      id: `mock_chat_${idx + 1}`
    })),
    participantNamesToPseudonyms: { [donorName]: "Donor" },
    chatMappingToShow: new Map<string, string[]>()
  })
);
