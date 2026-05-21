import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";

import { createMockDbClient } from "@/app/__tests__/mockDbClient";

describe("donation actions - duplicate check config", () => {
  const originalServerToggle = process.env.DUPLICATE_DONATION_CHECK_ENABLED;
  const originalPublicToggle = process.env.NEXT_PUBLIC_DUPLICATE_DONATION_CHECK_ENABLED;
  const originalCsvPath = process.env.DUPLICATE_CHECK_EXCEPTION_HASHES_CSV_PATH;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env.DUPLICATE_DONATION_CHECK_ENABLED = originalServerToggle;
    process.env.NEXT_PUBLIC_DUPLICATE_DONATION_CHECK_ENABLED = originalPublicToggle;
    process.env.DUPLICATE_CHECK_EXCEPTION_HASHES_CSV_PATH = originalCsvPath;
    jest.resetModules();
  });

  test("checkForDuplicateConversations can be disabled via config", async () => {
    process.env.DUPLICATE_DONATION_CHECK_ENABLED = "false";
    process.env.NEXT_PUBLIC_DUPLICATE_DONATION_CHECK_ENABLED = "false";

    const { checkForDuplicateConversations } = await import("@/app/data-donation/actions");
    const throwingClient = createMockDbClient({
      query: {
        conversations: {
          findMany: () => {
            throw new Error("findMany should not be called when duplicate check is disabled");
          }
        }
      }
    }).client;

    const res = await checkForDuplicateConversations(["a".repeat(64)], throwingClient);

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ hasDuplicates: false });
  });

  test("checkForDuplicateConversations ignores hashes configured as exceptions", async () => {
    process.env.DUPLICATE_DONATION_CHECK_ENABLED = "true";
    process.env.NEXT_PUBLIC_DUPLICATE_DONATION_CHECK_ENABLED = "true";

    const hash = "a".repeat(64);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "dona-duplicate-check-"));
    const csvPath = path.join(tempDir, "exceptions.csv");
    await fs.writeFile(csvPath, `conversationHash\n${hash}\n`, "utf8");
    process.env.DUPLICATE_CHECK_EXCEPTION_HASHES_CSV_PATH = csvPath;

    const { checkForDuplicateConversations } = await import("@/app/data-donation/actions");
    const overriding = createMockDbClient({
      query: {
        conversations: {
          findMany: jest.fn(async (_opts?: any): Promise<any[]> => [])
        }
      }
    } as any).client;

    const res = await checkForDuplicateConversations([hash], overriding);

    expect(overriding.query!.conversations!.findMany).not.toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ hasDuplicates: false });
  });
});
