import { maskName } from "@services/parsing/shared/names";
import { describe, expect, it } from "@jest/globals";

describe("maskName", () => {
  it("should replace all characters except the first two letters of each word with asterisks", () => {
    expect(maskName("John Doe")).toBe("Jo** Do*");
    expect(maskName("Jane-Marie O'Connor")).toBe("Ja******** O'******");
  });

  it("should handle names with punctuation correctly", () => {
    expect(maskName("Dr. Smith")).toBe("Dr* Sm***");
    expect(maskName("Mr. T!")).toBe("Mr* T!");
  });

  it("should handle single-word names", () => {
    expect(maskName("Alice")).toBe("Al***");
    expect(maskName("O'Connor")).toBe("O'******");
  });

  it("should handle names with multiple spaces", () => {
    expect(maskName("  John   Doe  ")).toBe("Jo** Do*");
  });

  it("should handle empty strings", () => {
    expect(maskName("")).toBe("");
    expect(maskName("   ")).toBe("");
  });

  it("should handle names with only punctuation", () => {
    expect(maskName("...")).toBe("..*");
    expect(maskName("!?")).toBe("!?");
  });

  it("should handle names with other characters", () => {
    expect(maskName("John_Doe")).toBe("Jo******");
    expect(maskName("Jane@Doe")).toBe("Ja******");
  });

  it("should handle names with special characters", () => {
    expect(maskName("Ukraine - Hilfe Koblenz e.V. 🇺🇦")).toBe("Uk***** - Hi*** Ko***** e.** 🇺🇦");
    expect(maskName("Someone Happy 😊😊😊")).toBe("So***** Ha*** 😊😊*");
  });
});
