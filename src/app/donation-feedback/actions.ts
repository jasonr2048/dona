"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db/drizzle";
import { conversations as conversationsTbl, donations as donationsTbl, graphData } from "@/db/schema";
import { DONATION_ID_COOKIE } from "@/middleware";
import produceGraphData from "@/services/charts/produceGraphData";
import { GraphData } from "@models/graphData";
import { DonationStatus, Conversation } from "@models/processed";

export async function fetchGraphDataByDonationId(donationId: string): Promise<Record<string, GraphData>> {
  const result = await db.query.graphData.findFirst({
    where: eq(graphData.donationId, donationId),
    columns: { data: true }
  });

  if (!result) {
    throw new Error("Graph data not found for the given donation ID.");
  }

  return result.data as Record<string, GraphData>;
}

// New: fetch or compute graph data if missing for a valid donation
export async function fetchOrComputeGraphDataByDonationId(donationId: string): Promise<Record<string, GraphData>> {
  // Try existing
  const existing = await db.query.graphData.findFirst({
    where: eq(graphData.donationId, donationId),
    columns: { data: true }
  });
  if (existing?.data) return existing.data as Record<string, GraphData>;

  // Validate donation
  const donation = await db.query.donations.findFirst({
    where: eq(donationsTbl.id, donationId),
    columns: { id: true, donorId: true, status: true }
  });
  if (!donation || donation.status !== DonationStatus.Complete || !donation.donorId) {
    throw new Error("Graph data not found and donation is not valid for recomputation.");
  }

  // Load conversations with relations
  const convos = await db.query.conversations.findMany({
    where: eq(conversationsTbl.donationId, donationId),
    with: {
      dataSource: true,
      participants: true,
      messages: true,
      messagesAudio: true
    }
  });

  // Map to processed conversations
  const processedConversations: Conversation[] = convos.map(c => ({
    isGroupConversation: c.isGroupConversation ?? undefined,
    dataSource: c.dataSource.name,
    messages: c.messages.map(m => ({
      wordCount: m.wordCount,
      timestamp: new Date(m.dateTime).getTime(),
      sender: m.senderId
    })),
    messagesAudio: c.messagesAudio.map(a => ({
      lengthSeconds: a.lengthSeconds ?? 0,
      timestamp: new Date(a.dateTime).getTime(),
      sender: a.senderId
    })),
    participants: c.participants.map(p => p.participantId),
    conversationPseudonym: c.conversationPseudonym,
    focusInFeedback: c.focusInFeedback ?? true
  }));

  const computed = produceGraphData(donation.donorId, processedConversations);

  // Persist newly computed graph data
  await db.insert(graphData).values({ donationId, data: computed });

  return computed as Record<string, GraphData>;
}

export async function getDonationId() {
  return (await cookies()).get(DONATION_ID_COOKIE)?.value;
}
