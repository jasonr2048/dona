import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { DonationErrors } from "@services/errors";

type ZipEntryLike = { filename: string };

async function setupModule(
  profileContentFactory: () => string,
  options: {
    entries?: ZipEntryLike[];
    textByFilename?: Record<string, string>;
  } = {}
) {
  const entries = options.entries ?? [
    { filename: "personal_information.json" },
    { filename: "inbox/test_thread/message_1.json" }
  ];
  const mockExtractEntriesFromZips = jest.fn().mockResolvedValue(entries);

  const mockGetEntryText = jest.fn(async (entry: ZipEntryLike) => {
    if (options.textByFilename?.[entry.filename]) {
      return options.textByFilename[entry.filename];
    }
    if (entry.filename.includes("message")) {
      return JSON.stringify({ thread_path: "inbox/test_thread", participants: [], messages: [] });
    }
    return profileContentFactory();
  });

  const mockDeIdentify = jest.fn(() => ({
    anonymizedConversations: [],
    posts: [],
    comments: [],
    reactions: [],
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

  const { handleFacebookZipFiles, handleInstagramZipFiles } = await import("@services/parsing/meta/metaHandlers");

  return {
    handleFacebookZipFiles,
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

  it("does not collect public content unless explicitly enabled", async () => {
    const entries = [
      { filename: "personal_information/personal_information.json" },
      { filename: "messages/inbox/test_thread/message_1.json" },
      { filename: "your_instagram_activity/content/posts_1.json" },
      { filename: "your_instagram_activity/comments/post_comments_1.json" },
      { filename: "your_instagram_activity/likes/liked_posts.json" }
    ];

    const { handleInstagramZipFiles, mockDeIdentify } = await setupModule(
      () =>
        JSON.stringify({
          profile_user: [
            {
              string_map_data: {
                Username: { value: "username_only" }
              }
            }
          ]
        }),
      {
        entries,
        textByFilename: {
          "your_instagram_activity/content/posts_1.json": JSON.stringify([{ title: "public post" }]),
          "your_instagram_activity/comments/post_comments_1.json": JSON.stringify([{ comment: "public comment" }]),
          "your_instagram_activity/likes/liked_posts.json": JSON.stringify({ likes_media_likes: [] })
        }
      }
    );

    await handleInstagramZipFiles([new File(["x"], "dummy.zip")]);

    expect(mockDeIdentify.mock.calls[0][4]).toEqual([]);
    expect(mockDeIdentify.mock.calls[0][5]).toEqual([]);
    expect(mockDeIdentify.mock.calls[0][6]).toEqual([]);
  });

  it("passes Instagram public content to deIdentify when enabled", async () => {
    const entries = [
      { filename: "personal_information/personal_information.json" },
      { filename: "messages/inbox/test_thread/message_1.json" },
      { filename: "your_instagram_activity/content/posts_1.json" },
      { filename: "your_instagram_activity/comments/post_comments_1.json" },
      { filename: "your_instagram_activity/likes/liked_posts.json" },
      { filename: "your_instagram_activity/past_instagram_insights/posts.json" }
    ];
    const postJson = JSON.stringify([{ title: "public post" }]);
    const commentJson = JSON.stringify([{ string_map_data: { Comment: { value: "public comment" } } }]);
    const reactionJson = JSON.stringify({ likes_media_likes: [] });

    const { handleInstagramZipFiles, mockDeIdentify } = await setupModule(
      () =>
        JSON.stringify({
          profile_user: [
            {
              string_map_data: {
                Username: { value: "username_only" }
              }
            }
          ]
        }),
      {
        entries,
        textByFilename: {
          "your_instagram_activity/content/posts_1.json": postJson,
          "your_instagram_activity/comments/post_comments_1.json": commentJson,
          "your_instagram_activity/likes/liked_posts.json": reactionJson,
          "your_instagram_activity/past_instagram_insights/posts.json": JSON.stringify([{ ignored: true }])
        }
      }
    );

    await handleInstagramZipFiles([new File(["x"], "dummy.zip")], { includePublicContent: true });

    expect(mockDeIdentify.mock.calls[0][4]).toEqual([postJson]);
    expect(mockDeIdentify.mock.calls[0][5]).toEqual([commentJson]);
    expect(mockDeIdentify.mock.calls[0][6]).toEqual([reactionJson]);
  });

  it("passes Facebook public content to deIdentify when enabled", async () => {
    const entries = [
      { filename: "profile_information/profile_information.json" },
      { filename: "messages/inbox/test_thread/message_1.json" },
      { filename: "your_facebook_activity/posts/your_posts.json" },
      { filename: "your_facebook_activity/comments/comments.json" },
      { filename: "your_facebook_activity/likes/likes.json" }
    ];
    const postJson = JSON.stringify([{ data: [{ post: "public post" }] }]);
    const commentJson = JSON.stringify({ comments_v2: [{ data: [{ comment: { comment: "public comment" } }] }] });
    const reactionJson = JSON.stringify([{ data: [{ reaction: { reaction: "LIKE" } }] }]);

    const { handleFacebookZipFiles, mockDeIdentify } = await setupModule(
      () =>
        JSON.stringify({
          profile_v2: {
            name: {
              full_name: "Facebook Donor"
            }
          }
        }),
      {
        entries,
        textByFilename: {
          "your_facebook_activity/posts/your_posts.json": postJson,
          "your_facebook_activity/comments/comments.json": commentJson,
          "your_facebook_activity/likes/likes.json": reactionJson
        }
      }
    );

    await handleFacebookZipFiles([new File(["x"], "dummy.zip")], { includePublicContent: true });

    expect(mockDeIdentify.mock.calls[0][3]).toBe("Facebook");
    expect(mockDeIdentify.mock.calls[0][4]).toEqual([postJson]);
    expect(mockDeIdentify.mock.calls[0][5]).toEqual([commentJson]);
    expect(mockDeIdentify.mock.calls[0][6]).toEqual([reactionJson]);
  });
});
