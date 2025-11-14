import { Conversation, Message } from "@models/processed";
import { getAliasConfig } from "@services/parsing/shared/aliasConfig";

function computeDonorWordCount(messages: Message[], donorAlias: string): number {
  return messages.reduce((count, message) => {
    return message.sender === donorAlias ? count + message.wordCount : count;
  }, 0);
}

export function sortConversationsByWordCount(conversations: Conversation[]): Conversation[] {
  const aliasConfig = getAliasConfig();
  return conversations.toSorted((a, b) => {
    const wordCountA = computeDonorWordCount(a.messages, aliasConfig.donorAlias);
    const wordCountB = computeDonorWordCount(b.messages, aliasConfig.donorAlias);
    return wordCountB - wordCountA;
  });
}
