import { Conversation } from "@models/processed";

export const createJsonDownloadUrl = (conversations: Conversation[]): string => {
  const jsonBlob = new Blob([JSON.stringify(conversations, null, 2)], { type: "application/json" });
  return URL.createObjectURL(jsonBlob);
};
