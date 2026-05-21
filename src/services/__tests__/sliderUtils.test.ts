import { describe, expect, it } from "@jest/globals";
import {
  parseYearMonth,
  monthDiff,
  monthsBetweenInclusive,
  sparseMarks,
  SliderMark
} from "@services/charts/sliderUtils";

describe("sliderUtils", () => {
  describe("parseYearMonth", () => {
    it("should parse a typical YYYY-MM label", () => {
      const result = parseYearMonth("2023-12");
      expect(result).toEqual({ year: 2023, month: 12 });
    });

    it("should parse a label with single-digit month", () => {
      const result = parseYearMonth("2023-05");
      expect(result).toEqual({ year: 2023, month: 5 });
    });

    it("should parse January", () => {
      const result = parseYearMonth("2024-01");
      expect(result).toEqual({ year: 2024, month: 1 });
    });

    it("should handle invalid format gracefully", () => {
      const result = parseYearMonth("invalid");
      expect(Number.isNaN(result.year)).toBe(true);
      // month will be undefined when split doesn't produce a second element
      expect(result.month === undefined || Number.isNaN(result.month)).toBe(true);
    });
  });

  describe("monthDiff", () => {
    it("should return 0 for the same month", () => {
      expect(monthDiff("2023-06", "2023-06")).toBe(0);
    });

    it("should calculate difference within the same year", () => {
      expect(monthDiff("2023-01", "2023-06")).toBe(5);
    });

    it("should calculate difference across years", () => {
      expect(monthDiff("2023-11", "2024-02")).toBe(3);
    });

    it("should calculate multi-year difference", () => {
      expect(monthDiff("2020-01", "2023-01")).toBe(36);
    });

    it("should handle negative difference (earlier to later)", () => {
      expect(monthDiff("2023-06", "2023-01")).toBe(-5);
    });
  });

  describe("monthsBetweenInclusive", () => {
    it("should include both endpoints for the same month", () => {
      expect(monthsBetweenInclusive("2023-06", "2023-06")).toBe(1);
    });

    it("should count months inclusively", () => {
      expect(monthsBetweenInclusive("2023-01", "2023-03")).toBe(3);
    });

    it("should handle year boundaries", () => {
      expect(monthsBetweenInclusive("2023-11", "2024-02")).toBe(4);
    });
  });

  describe("sparseMarks", () => {
    const createMarks = (count: number, startYear = 2020, startMonth = 1): SliderMark[] => {
      const marks: SliderMark[] = [];
      let year = startYear;
      let month = startMonth;
      for (let i = 0; i < count; i++) {
        marks.push({
          value: i,
          label: `${year}-${month.toString().padStart(2, "0")}`
        });
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }
      return marks;
    };

    it("should return empty array for empty input", () => {
      expect(sparseMarks([], 5)).toEqual([]);
    });

    it("should return empty array for maxLabels <= 0", () => {
      const marks = createMarks(10);
      expect(sparseMarks(marks, 0)).toEqual([]);
      expect(sparseMarks(marks, -1)).toEqual([]);
    });

    it("should return all marks if length <= maxLabels", () => {
      const marks = createMarks(5);
      expect(sparseMarks(marks, 5)).toEqual(marks);
      expect(sparseMarks(marks, 10)).toEqual(marks);
    });

    it("should always include first and last marks", () => {
      const marks = createMarks(20);
      const result = sparseMarks(marks, 5);
      expect(result[0]).toEqual(marks[0]);
      expect(result[result.length - 1]).toEqual(marks[marks.length - 1]);
    });

    it("should produce evenly spaced labels when (n-1) divisible by (k-1)", () => {
      // 13 marks, maxLabels=7: (13-1) % (7-1) = 12 % 6 = 0
      const marks = createMarks(13);
      const result = sparseMarks(marks, 7);
      expect(result.length).toBe(7);
      expect(result.map(m => m.value)).toEqual([0, 2, 4, 6, 8, 10, 12]);
    });

    it("should avoid singleton holes (n - k == 1)", () => {
      // 11 marks, maxLabels=10 would leave 1 unlabeled month
      // Should choose k=9 or k=11 instead
      const marks = createMarks(11);
      const result = sparseMarks(marks, 10);
      expect(result.length).not.toBe(10);
      expect(11 - result.length).not.toBe(1);
    });

    it("should handle case where exact divisor exists", () => {
      // 25 marks, maxLabels=10: (25-1)=24, try k where (24 % (k-1)) == 0
      // k=7: 24 % 6 = 0, no singleton hole (25-7=18)
      const marks = createMarks(25);
      const result = sparseMarks(marks, 10);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result[0].value).toBe(0);
      expect(result[result.length - 1].value).toBe(24);
    });

    it("should distribute labels roughly evenly for large arrays", () => {
      const marks = createMarks(100);
      const result = sparseMarks(marks, 10);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(10);
      // Check spacing is relatively even
      const gaps = [];
      for (let i = 1; i < result.length; i++) {
        gaps.push(result[i].value - result[i - 1].value);
      }
      const minGap = Math.min(...gaps);
      const maxGap = Math.max(...gaps);
      expect(maxGap - minGap).toBeLessThanOrEqual(2); // Gaps should differ by at most 2
    });

    it("should handle small maxLabels value", () => {
      const marks = createMarks(50);
      const result = sparseMarks(marks, 3);
      // With n=50, maxLabels=3: algorithm may choose k=2 to avoid singleton hole or get better spacing
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(3);
      expect(result[0].value).toBe(0);
      expect(result[result.length - 1].value).toBe(49);
    });

    it("should deduplicate marks with same value in sparse case", () => {
      const marks: SliderMark[] = [
        { value: 0, label: "2020-01" },
        { value: 1, label: "2020-02" },
        { value: 2, label: "2020-03" },
        { value: 3, label: "2020-04" },
        { value: 4, label: "2020-05" },
        { value: 5, label: "2020-06" },
        { value: 6, label: "2020-07" },
        { value: 7, label: "2020-08" },
        { value: 8, label: "2020-09" },
        { value: 9, label: "2020-10" },
        { value: 10, label: "2020-11" }
      ];
      const result = sparseMarks(marks, 5);
      // The deduplication logic is in the sparse case
      const values = result.map(m => m.value);
      expect(new Set(values).size).toBe(values.length); // All unique
    });
  });
});
