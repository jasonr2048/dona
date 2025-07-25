import {CONFIG} from '@/config';
import {Conversation} from '@/models/processed';
import {calculateMinMaxDates} from "@services/rangeFiltering";

export function validateMinChatsForDonation(conversations: Conversation[] | File[]): boolean {
    return conversations.length >= CONFIG.MIN_CHATS_FOR_DONATION;
}

export function validateMinImportantChatsForDonation(conversations: Conversation[]): boolean {

    // Filter conversations based on messages and contacts, for validation
    const filteredConversations = conversations.filter(conv => {
        return conv.messages.length + conv.messagesAudio.length >= CONFIG.MIN_MESSAGES_PER_CHAT &&
            conv.participants.length >= CONFIG.MIN_CONTACTS_PER_CHAT
    });

    // Final validation for the number of conversations after filtering
    return validateMinChatsForDonation(filteredConversations);
}


export function validateMinTimePeriodForDonation(conversations: Conversation[]): boolean {
    const { minDate, maxDate } = calculateMinMaxDates(conversations);
    console.log("Min Date:", minDate, "Max Date:", maxDate);
    if (!minDate || !maxDate) return false;

    const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
    const diffMonths = diffTime / (1000 * 3600 * 24 * 30); // Approx. months difference
    return diffMonths >= CONFIG.MIN_DONATION_TIME_PERIOD_MONTHS;
}