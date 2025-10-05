import {Conversation} from "@models/processed";


type ConversationStats = { participants: number; messages: number; audioMessages: number };

export const computeConversationStats = (
    conversations: Conversation[]
): Map<string, ConversationStats> => {

    const conversationStats = new Map<string, { participants: number, messages: number, audioMessages: number }>();
    conversations.forEach(conversation => {
        if (conversation.id != null) {
            conversationStats.set(conversation.id, {
                participants: new Set(conversation.participants).size,
                messages: conversation.messages.length,
                audioMessages: conversation.messagesAudio.length
            });
        }
    });
    return conversationStats;
}


export const createConversation = (
    dataSource: string,
    messages: Array<[number, number, number, string]>, // Format: [year, month, date, sender]
    audioMessages: Array<[number, number, number, string, number]> = [], // Format: [year, month, date, sender, lengthSeconds]
    focusInFeedback: boolean = true,
    conversationPseudonym: string = "test-convo"
): Conversation => {
    const parsedMessages = messages.map(([year, month, date, sender]) => ({
        timestamp: new Date(year, month - 1, date, 12, 0).getTime(),
        wordCount: 15,
        sender,
    }));

    const parsedAudioMessages = audioMessages.map(([year, month, date, sender, lengthSeconds]) => ({
        timestamp: new Date(year, month - 1, date, 12, 0).getTime(),
        lengthSeconds,
        sender,
    }));

    const participants = [...new Set([...messages.map(([, , , sender]) => sender), ...audioMessages.map(([, , , sender]) => sender)])];

    return {
        isGroupConversation: participants.length > 2,
        conversationId: "123",
        participants,
        messages: parsedMessages,
        messagesAudio: parsedAudioMessages,
        dataSource,
        conversationPseudonym,
        focusInFeedback
    };
};
