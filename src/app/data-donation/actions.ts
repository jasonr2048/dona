'use server';

import {db} from "@/db/drizzle";
import {v4 as uuidv4} from 'uuid';
import {conversationParticipants, conversations, donations, graphData, messages} from "@/db/schema";
import {NewConversation, NewMessage} from "@models/persisted";
import {Conversation, DonationStatus} from "@models/processed";
import {DonationErrors, DonationProcessingError, SerializedDonationError} from "@services/errors";
import { eq } from 'drizzle-orm';


function generateExternalDonorId(): string {
    return Math.random().toString(36).substring(2, 8);
}


interface ActionResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: SerializedDonationError;
}

export async function startDonation(
    externalDonorId?: string
): Promise<ActionResult<{ donationId: string; donorId: string }>> {
    const donorId = uuidv4();
    const externalIdToUse = externalDonorId || generateExternalDonorId();
    console.log(`[DONATION][SERVER] startDonation: donorId=${donorId} externalDonorId=${externalIdToUse}`);
    try {
        const inserted = await db.insert(donations).values({
            donorId,
            externalDonorId: externalIdToUse,
            status: DonationStatus.Pending,
        }).returning({id: donations.id});

        const donationId = inserted[0]?.id!;
        return {success: true, data: {donationId, donorId}};
    } catch (err) {
        return {success: false, error: DonationProcessingError(DonationErrors.TransactionFailed, {originalError: err})};
    }
}

export async function appendConversationBatch(
    donationId: string,
    donorId: string,
    batch: Conversation[],
    donorAlias: string
): Promise<ActionResult<{ inserted: number }>> {
    console.log(`[DONATION][SERVER] appendConversationBatch: donationId=${donationId} donorId=${donorId} batchSize=${batch.length}`);
    try {
        await db.transaction(async (tx) => {
            for (const convo of batch) {
                const newConversation: NewConversation = NewConversation.create(
                    donationId,
                    convo,
                    (await db.query.dataSources.findMany()) as any // reuse as in existing code
                );
                const [{ id: conversationId }] = await tx
                    .insert(conversations)
                    .values(newConversation)
                    .returning({ id: conversations.id });

                const participantIdMap: Record<string, string> = {};
                const resolveParticipantId = (participant: string): string => {
                    // Preserve current donorId mapping behavior: donor === donorAlias
                    if (participant === donorAlias) return donorId;
                    if (!participantIdMap[participant]) participantIdMap[participant] = uuidv4();
                    return participantIdMap[participant];
                };

                // Messages
                for (const message of convo.messages) {
                    const senderId = resolveParticipantId(message.sender);
                    const newMessage: NewMessage = NewMessage.create(conversationId, {
                        ...message,
                        sender: senderId,
                    });
                    await tx.insert(messages).values(newMessage);
                }

                // Participants
                for (const participant of convo.participants) {
                    const participantId = resolveParticipantId(participant);
                    await tx.insert(conversationParticipants).values({
                        participantId,
                        conversationId,
                        participantPseudonym: participant,
                    });
                }
            }
        });
        return { success: true, data: { inserted: batch.length } };
    } catch (err) {
        return { success: false, error: DonationProcessingError(DonationErrors.TransactionFailed, { originalError: err }) };
    }
}

export async function finalizeDonation(
    donationId: string,
    graphDataRecord: Record<string, any>
): Promise<ActionResult<{ donationId: string }>> {
    console.log(`[DONATION][SERVER] finalizeDonation: donationId=${donationId}`);
    try {
        await db.transaction(async (tx) => {
            await tx.insert(graphData).values({ donationId, data: graphDataRecord });
            await tx.update(donations)
                .set({ status: DonationStatus.Complete })
                .where(eq(donations.id, donationId));
        });
        return { success: true, data: { donationId } };
    } catch (err) {
        return { success: false, error: DonationProcessingError(DonationErrors.TransactionFailed, { originalError: err }) };
    }
}
