import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { createMockDbClient } from "@/app/__tests__/mockDbClient";

describe("donation actions - demo mode", () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.DEMO_MODE = "true";
    jest.resetModules();
  });

  afterEach(() => {
    process.env.DEMO_MODE = originalDemoMode;
    jest.resetModules();
  });

  test("startDonation returns demo identifiers and skips DB writes", async () => {
    const { startDonation } = await import("@/app/data-donation/actions");
    const throwingClient = createMockDbClient({
      insert: () => {
        throw new Error("insert should not be called in demo mode");
      }
    }).client;

    const res = await startDonation("ext-1", undefined, throwingClient);

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      donationId: "demo-mode",
      donorId: "demo-mode"
    });
  });

  test("appendConversationBatch returns inserted count and skips DB writes", async () => {
    const { appendConversationBatch } = await import("@/app/data-donation/actions");
    const throwingClient = createMockDbClient({
      query: {
        dataSources: {
          findMany: () => {
            throw new Error("query should not be called in demo mode");
          }
        }
      }
    }).client;

    const batch = [
      {
        dataSource: "Default",
        participants: ["Donor", "Alice"],
        messages: [{ sender: "Donor", text: "Hi", createdAt: new Date().toISOString() }],
        messagesAudio: []
      }
    ];

    const res = await appendConversationBatch("don-1", "donor-1", batch as any, "Donor", throwingClient);

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ inserted: 1 });
  });

  test("finalizeDonation returns demo donation id and skips DB writes", async () => {
    const { finalizeDonation } = await import("@/app/data-donation/actions");
    const throwingClient = createMockDbClient({
      transaction: async () => {
        throw new Error("transaction should not be called in demo mode");
      }
    }).client;

    const res = await finalizeDonation("don-1", { nodes: [], edges: [] }, throwingClient);

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ donationId: "demo-mode" });
  });

  test("checkForDuplicateConversations reports no duplicates and skips DB queries", async () => {
    const { checkForDuplicateConversations } = await import("@/app/data-donation/actions");
    const throwingClient = createMockDbClient({
      query: {
        conversations: {
          findMany: () => {
            throw new Error("findMany should not be called in demo mode");
          }
        }
      }
    }).client;

    const res = await checkForDuplicateConversations(["hash-a", "hash-b"], throwingClient);

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ hasDuplicates: false });
  });
});
