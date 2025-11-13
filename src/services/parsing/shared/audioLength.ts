import { BlobWriter } from "@zip.js/zip.js";
import { parseBlob } from "music-metadata";
import { ValidEntry } from "@services/parsing/shared/zipExtraction";

export default async function calculateAudioLength(audioFile?: ValidEntry): Promise<number> {
  if (!audioFile) return -1;

  try {
    // Method 1: Web Audio API - more reliable for WAV files
    const blobWriter = new BlobWriter();
    const blob = await audioFile.getData(blobWriter);
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const duration = audioBuffer.duration;
    return Math.floor(duration);
  } catch (error) {
    console.error("Error processing audio file with Web Audio API:", error);

    // Method 2: Metadata extraction fallback
    try {
      const blobWriter = new BlobWriter();
      const blob = await audioFile.getData(blobWriter);
      const metadata = await parseBlob(blob);
      const duration = metadata.format.duration;
      return Math.floor(duration || 0);
    } catch (secondError) {
      console.error("Error extracting duration from audio file:", secondError);
      return -2;
    }
  }
}
