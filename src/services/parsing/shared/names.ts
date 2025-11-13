/**
 * Masks a name by replacing all but the first character of each word with asterisks.
 * Consecutive spaces are reduced to a single space, and leading/trailing spaces are removed.
 * Special characters and emojis are treated as single characters.
 *
 * @example
 * maskName("John Doe");
 * // Returns: "Jo** Do*"
 *
 * @example
 * maskName("  Dr. Jane Smith  ");
 * // Returns: "Dr* Ja** Sm***"
 *
 * @example
 * maskName("Ukraine - Hilfe Koblenz e.V. 🇺🇦");
 * // Returns: "Uk***** - Hi*** Ko***** e.** 🇺🇦"
 */
export const maskName = (name: string): string => {
  if (!name.trim()) {
    return "";
  }
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) {
        return word;
      }
      const firstTwoChars = Array.from(word).slice(0, 2).join("");
      const remainingChars = Array.from(word)
        .slice(2)
        .map((char) => "*")
        .join("");
      return firstTwoChars + remainingChars;
    })
    .join(" ");
};
