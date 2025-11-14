import { beforeEach, describe, expect, test } from "@jest/globals";

import { createMockDbClient } from "@/app/__tests__/mockDbClient";
import { appendConversationBatch, finalizeDonation, startDonation } from "@/app/data-donation/actions";
import { DonationErrors } from "@/services/errors";

describe("donation actions - unit", () => {
  let mock: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mock = createMockDbClient();
  });

  test("startDonation returns donationId and donorId on success", async () => {
    const { client } = mock;
    const res = await startDonation(undefined, client);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(typeof res.data!.donationId).toBe("string");
    expect(typeof res.data!.donorId).toBe("string");
  });

  test("startDonation returns DonationProcessingError with reason TransactionFailed when insert throws", async () => {
    const throwing = createMockDbClient({
      insert: () =>
        ({
          values: () => {
            throw new Error("insert-failed");
          }
        }) as any
    }).client;

    const res = await startDonation("ext-1", throwing);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect((res.error as any).reason).toBe(DonationErrors.TransactionFailed);
  });

  test("appendConversationBatch inserts conversations, messages and participants", async () => {
    const { client } = mock;

    const batch = [
      {
        dataSource: "Default",
        participants: ["Donor", "Alice"],
        messages: [
          { sender: "Donor", text: "Hi", createdAt: new Date().toISOString() },
          { sender: "Alice", text: "Hello", createdAt: new Date().toISOString() }
        ],
        messagesAudio: [
          {
            sender: "Alice",
            url: "https://example.com/a1.mp3",
            createdAt: new Date().toISOString()
          }
        ]
      }
    ];

    const result = await appendConversationBatch("don-1", "donor-uuid-1", batch as any, "Donor", client);
    expect(result.success).toBe(true);
  });

  test("appendConversationBatch handles large message volumes by splitting windows", async () => {
    const { client } = mock;

    const manyMessages = Array.from({ length: 15000 }).map((_, i) => ({
      sender: i % 2 === 0 ? "Donor" : "Alice",
      text: `msg-${i}`,
      createdAt: new Date().toISOString()
    }));
    const batch = [
      {
        dataSource: "Default",
        participants: ["Donor", "Alice"],
        messages: manyMessages,
        messagesAudio: []
      }
    ];

    const result = await appendConversationBatch("don-2", "donor-uuid-2", batch as any, "Donor", client);
    expect(result.success).toBe(true);
  });

  test("finalizeDonation writes graphData and updates donation status", async () => {
    const { client } = mock;

    const graph = { nodes: [], edges: [] };
    const res = await finalizeDonation("don-3", graph, client);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.donationId).toBe("don-3");
  });

  test("finalizeDonation returns error when transaction fails", async () => {
    const throwingTx = createMockDbClient({
      transaction: async (_fn: any) => {
        throw new Error("tx-failed");
      }
    }).client;

    const res = await finalizeDonation("don-4", { foo: "bar" }, throwingTx);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
