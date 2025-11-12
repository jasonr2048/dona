import wordCount from '@services/parsing/shared/wordCount';
import emojiCount from '@services/parsing/shared/emojiCount';
import {ValidEntry} from "@services/parsing/shared/zipExtraction";
import calculateAudioLength from "@services/parsing/shared/audioLength";
import {isTextMessage, isVoiceMessage} from "@services/parsing/meta/messageChecks";
import {ParsedConversation} from "@services/parsing/meta/metaHandlers";
import {AnonymizationResult, Conversation, DataSourceValue, Message, MessageAudio} from "@models/processed";
import {getAliasConfig} from "@services/parsing/shared/aliasConfig";
import {ChatPseudonyms, ContactPseudonyms} from "@services/parsing/shared/pseudonyms";


export default async function deIdentify(
    parsedConversations: ParsedConversation[],
    audioEntries: ValidEntry[],
    donorName: string,
    dataSourceValue: DataSourceValue
): Promise<AnonymizationResult> {
    const aliasConfig = getAliasConfig();
    const contactPseudonyms = new ContactPseudonyms(aliasConfig.contactAlias);
    const chatPseudonyms = new ChatPseudonyms(aliasConfig.donorAlias, aliasConfig.chatAlias, dataSourceValue);
    chatPseudonyms.setDonorName(donorName);
    contactPseudonyms.setPseudonym(donorName, aliasConfig.donorAlias);

    const deIdentifiedConversations: Conversation[] = await Promise.all(
        parsedConversations.map(async (jsonContent): Promise<Conversation | null> => {

            const textMessages: Message[] = [];
            const audioMessages: MessageAudio[] = [];

            // Generate participant pseudonyms first (using participants array, not messages)
            const participantPseudonyms = new Set<string>();
            jsonContent.participants.forEach(participant => {
                const participantName = contactPseudonyms.getPseudonym(participant.name);
                participantPseudonyms.add(participantName);
            });

            await Promise.all(
                jsonContent.messages.map(async (messageData) => {
                    const timestamp = messageData.timestamp_ms;
                    const senderName = contactPseudonyms.getPseudonym(messageData.sender_name);

                    if (isVoiceMessage(messageData)) {
                        const audioUri = messageData.audio_files?.[0]?.uri
                        const audioFile = !audioUri ? undefined : audioEntries.find(
                            (entry) => entry.filename.endsWith(audioUri)
                        );
                        audioMessages.push({
                            lengthSeconds: await calculateAudioLength(audioFile),
                            timestamp,
                            sender: senderName,
                        } as MessageAudio);

                    } else if (isTextMessage(messageData)) {
                        const messageContent = messageData.content || "";
                        const emojis = emojiCount(messageContent);
                        textMessages.push({
                            wordCount: wordCount(messageContent),
                            emojiCounts: Object.keys(emojis).length > 0 ? emojis : undefined,
                            timestamp,
                            sender: senderName,
                        } as Message);
                    }
                })
            );
            if (textMessages.length === 0 && audioMessages.length === 0) {
                return null;
            }

            const participants = Array.from(participantPseudonyms);
            const isGroupConversation = participants.length > 2;

            // Add to chats to show
            contactPseudonyms.setPseudonym(donorName, aliasConfig.donorAlias);
            const conversationPseudonym = chatPseudonyms.getPseudonym(contactPseudonyms.getOriginalNames(participants));

            return {
                isGroupConversation,
                dataSource: dataSourceValue,
                messages: textMessages,
                messagesAudio: audioMessages,
                participants,
                conversationPseudonym
            } as Conversation;
        })
    ).then((results) => results.filter(Boolean) as Conversation[]);

    // TODO: Filtering and chat selection logic

    return {
        anonymizedConversations: deIdentifiedConversations,
        participantNamesToPseudonyms: contactPseudonyms.getPseudonymMap(),
        chatMappingToShow: chatPseudonyms.getPseudonymMap()
    };
}
