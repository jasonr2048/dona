import { BlobReader, BlobWriter, Entry, TextWriter, ZipReader } from "@zip.js/zip.js";

// Custom type for entries with getData
export interface ValidEntry extends Entry {
  getData: (writer: TextWriter | BlobWriter) => Promise<any>;
}

// Type guard to check for valid entries
const isValidEntry = (entry: Entry): entry is ValidEntry => typeof entry.getData === "function";

// Check if entry should be excluded (e.g., system files or folders)
const isExcludedEntry = (entry: Entry): boolean =>
  entry.filename.startsWith("__MACOSX/") ||
  entry.filename.endsWith(".DS_Store") ||
  entry.filename.trim() === "";

// Check that entry name matches the pattern provided
const isMatchingEntry = (entry: Entry, contentPattern: string): boolean =>
  entry.filename.trim().includes(contentPattern);

const getEntryText = (entry: ValidEntry): Promise<string> => entry.getData(new TextWriter());

async function extractTxtFilesFromZip(file: File): Promise<File[]> {
  const zipReader = new ZipReader(new BlobReader(file));
  const entries = await zipReader.getEntries();
  await zipReader.close();

  const txtFiles: File[] = [];

  for (const entry of entries) {
    // Exclude system files and ensure entry is a valid .txt file
    if (isValidEntry(entry) && !isExcludedEntry(entry) && entry.filename.endsWith(".txt")) {
      const content = await getEntryText(entry);
      txtFiles.push(new File([content], entry.filename));
    }
  }

  return txtFiles;
}

async function extractEntriesFromZips(files: File[]): Promise<ValidEntry[]> {
  let allEntries: Entry[] = [];

  for (const file of files) {
    const zipFileReader = new BlobReader(file);
    const zipReader = new ZipReader(zipFileReader);
    allEntries.push(...(await zipReader.getEntries()));
    await zipReader.close();
  }

  // Filter valid entries and exclude unwanted ones
  return allEntries.filter(
    (entry) => isValidEntry(entry) && !isExcludedEntry(entry)
  ) as ValidEntry[];
}

export { extractTxtFilesFromZip, extractEntriesFromZips, getEntryText, isMatchingEntry };
