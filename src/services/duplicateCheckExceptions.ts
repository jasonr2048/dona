export function parseDuplicateCheckExceptionHashesCsv(csvContent: string): Set<string> {
  const hashes = new Set<string>();

  csvContent.split(/\r?\n/).forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const firstColumn = trimmed.split(",")[0]?.trim().replace(/^"|"$/g, "");
    if (!firstColumn || firstColumn.toLowerCase() === "conversationhash") {
      return;
    }

    if (!/^[a-f0-9]{64}$/i.test(firstColumn)) {
      console.warn(`[DONATION] Skipping invalid exception hash on line ${idx + 1}: ${firstColumn}`);
      return;
    }

    hashes.add(firstColumn.toLowerCase());
  });

  return hashes;
}
