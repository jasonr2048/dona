import { conversations, messages, messagesAudio } from "@/db/schema";
import { Conversation, Message, DataSource, MessageAudio } from "@models/processed";

type NewConversation = typeof conversations.$inferInsert;
namespace NewConversation {
  export function create(donationId: string, convo: Conversation, dataSourceOptions: DataSource[]): NewConversation {
    const { isGroupConversation, dataSource, conversationPseudonym, focusInFeedback, conversationHash } = convo;
    return {
      donationId,
      dataSourceId: dataSourceOptions.find(({ name }) => name === dataSource)!.id,
      isGroupConversation: isGroupConversation || undefined,
      conversationPseudonym: conversationPseudonym,
      focusInFeedback: focusInFeedback ?? true,
      conversationHash: conversationHash || undefined
    };
  }
}

type NewMessage = typeof messages.$inferInsert;
namespace NewMessage {
  export function create(conversationId: string, message: Message): NewMessage {
    const { wordCount, emojiCounts, timestamp, sender } = message;
    return {
      wordCount,
      emojiCounts: emojiCounts || undefined,
      dateTime: new Date(timestamp),
      senderId: sender || undefined,
      conversationId: conversationId
    };
  }
}

type NewMessageAudio = typeof messagesAudio.$inferInsert;
namespace NewMessageAudio {
  export function create(conversationId: string, message: MessageAudio): NewMessageAudio {
    const { lengthSeconds, timestamp, sender } = message;
    return {
      lengthSeconds,
      dateTime: new Date(timestamp),
      senderId: sender || undefined,
      conversationId: conversationId
    };
  }
}

export { NewConversation, NewMessage, NewMessageAudio };
