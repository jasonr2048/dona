/**
 * Unified decoder for handling text from Meta platform exports especially
 * Handles emojis, Cyrillic, accented characters, and other special characters
 */
export function decode(input: string): string {
  if (!input) return input;

  try {
    // First try standard JSON Unicode escape sequence decoding
    let result = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    );

    // Check if we have UTF-8 bytes masquerading as characters (most common issue with Meta exports)
    if (/[\u00c0-\u00ff][\u0080-\u00bf]/.test(result)) {
      // This is a simple "one-shot" decoder for most Meta text encoding issues
      // Interpreting as Latin1 and then as UTF-8 fixes most Meta export encoding problems
      try {
        const bytes = Uint8Array.from([...result].map((c) => c.charCodeAt(0) & 0xff));
        return new TextDecoder("utf-8").decode(bytes);
      } catch (e) {
        // Fall back to the original result if this approach fails
        console.warn("UTF-8 reinterpretation failed", e);
      }
    }

    return result;
  } catch (e) {
    console.error("Error decoding text:", e);
    return input;
  }
}

// Process an entire JSON object to decode any string values
export const processJsonContent = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return decode(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(processJsonContent);
  }

  if (typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = processJsonContent(value);
    }
    return result;
  }

  return obj;
};
