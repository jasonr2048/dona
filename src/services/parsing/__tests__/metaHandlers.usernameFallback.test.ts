import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { DonationErrors } from "@services/errors";

type ZipEntryLike = { filename: string };

async function setupModule(profileContentFactory: () => string) {
  const mockExtractEntriesFromZips = jest
    .fn()
    .mockResolvedValue([{ filename: "personal_information.json" }, { filename: "inbox/test_thread/message_1.json" }]);

  const mockGetEntryText = jest.fn(async (entry: ZipEntryLike) => {
    if (entry.filename.includes("message")) {
      return JSON.stringify({ thread_path: "inbox/test_thread", participants: [], messages: [] });
    }
    return profileContentFactory();
  });

  const mockDeIdentify = jest.fn(() => ({
    anonymizedConversations: [],
    participantNamesToPseudonyms: {},
    chatMappingToShow: new Map()
  }));

  jest.doMock("@services/parsing/shared/aliasConfig", () => require("@services/__mocks__/aliasConfigMock"));
  jest.doMock("@services/parsing/shared/zipExtraction", () => ({
    extractEntriesFromZips: (...args: unknown[]) => mockExtractEntriesFromZips(...args),
    getEntryText: (...args: unknown[]) => mockGetEntryText(...args),
    isMatchingEntry: (entry: ZipEntryLike, pattern: string) => entry.filename.includes(pattern)
  }));
  jest.doMock("@services/parsing/meta/deIdentify", () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockDeIdentify(...args)
  }));

  const { handleInstagramZipFiles } = await import("@services/parsing/meta/metaHandlers");

  return {
    handleInstagramZipFiles,
    mockDeIdentify
  };
}

describe("metaHandlers Instagram donor name extraction", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("falls back to Username when Name is missing", async () => {
    const { handleInstagramZipFiles, mockDeIdentify } = await setupModule(() =>
      JSON.stringify({
        profile_user: [
          {
            string_map_data: {
              Username: { value: "username_only" }
            }
          }
        ]
      })
    );

    await handleInstagramZipFiles([new File(["x"], "dummy.zip")]);

    expect(mockDeIdentify).toHaveBeenCalled();
    expect(mockDeIdentify.mock.calls[0][2]).toBe("username_only");
  });

  it("returns NoDonorNameFound when both Name and Username are missing", async () => {
    const { handleInstagramZipFiles } = await setupModule(() =>
      JSON.stringify({
        profile_user: [
          {
            string_map_data: {}
          }
        ]
      })
    );

    await expect(handleInstagramZipFiles([new File(["x"], "dummy.zip")])).rejects.toMatchObject({
      reason: DonationErrors.NoDonorNameFound,
      message: DonationErrors.NoDonorNameFound
    });
  });
});
