import { describe, expect, it } from "@jest/globals";

import { CONFIG } from "@/config";
import {
  getDonationRequirementChecks,
  getFailedDonationRequirementErrors,
  validateMinChatsForDonation,
  validateMinImportantChatsForDonation,
  validateMinTimePeriodForDonation
} from "@/services/validation";
import { Conversation } from "@models/processed";
import { DonationErrors } from "@services/errors";

function createConversation({
  participants = 2,
  messageCount = CONFIG.MIN_MESSAGES_PER_CHAT,
  timestamp
}: {
  participants?: number;
  messageCount?: number;
  timestamp: number;
}): Conversation {
  return {
    dataSource: "WhatsApp",
    participants: Array.from({ length: participants }, (_, i) => `participant-${i}`),
    messages: Array.from({ length: messageCount }, (_, i) => ({
      sender: i % 2 === 0 ? "participant-0" : "participant-1",
      timestamp,
      wordCount: 3
    })),
    messagesAudio: [],
    conversationPseudonym: "chat"
  };
}

describe("validation service", () => {
  it("passes all donation requirements for a valid dataset", () => {
    const now = Date.now();
    const early = now - CONFIG.MIN_DONATION_TIME_PERIOD_MONTHS * 30 * 24 * 3600 * 1000 - 24 * 3600 * 1000;

    const conversations: Conversation[] = [
      createConversation({ timestamp: early }),
      createConversation({ timestamp: now }),
      createConversation({ timestamp: now }),
      createConversation({ timestamp: now }),
      createConversation({ timestamp: now })
    ];

    const checks = getDonationRequirementChecks(conversations);

    expect(validateMinChatsForDonation(conversations)).toBe(true);
    expect(validateMinImportantChatsForDonation(conversations)).toBe(true);
    expect(validateMinTimePeriodForDonation(conversations)).toBe(true);
    expect(checks).toEqual({
      minChats: true,
      minImportantChats: true,
      minTimePeriod: true
    });
  });

  it("flags multiple failures when chats, importance and period constraints are not met", () => {
    const now = Date.now();
    const conversations: Conversation[] = [
      createConversation({ timestamp: now, participants: 1, messageCount: 10 }),
      createConversation({ timestamp: now, participants: 1, messageCount: 10 })
    ];

    const checks = getDonationRequirementChecks(conversations);
    const failures = getFailedDonationRequirementErrors(checks);

    expect(checks).toEqual({
      minChats: false,
      minImportantChats: false,
      minTimePeriod: false
    });
    expect(failures).toEqual([DonationErrors.TooFewChats, DonationErrors.TooFewContactsOrMessages, DonationErrors.TooShortTimePeriod]);
  });
});
