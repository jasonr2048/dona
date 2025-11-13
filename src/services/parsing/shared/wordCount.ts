export default function wordCount(messageContent: string): number {
  return messageContent
    .trim()
    .split(/\s+/)
    .filter((str) => str != "").length;
}
