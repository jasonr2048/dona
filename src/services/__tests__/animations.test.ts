import { describe, expect, it } from "@jest/globals";
import { prepareCountsOverTimeData } from "@services/charts/animations";

describe("animations", () => {
  describe("prepareCountsOverTimeData", () => {
    it("should handle a single conversation with simple monthly data", () => {
      const data = {
        "conv-1": [
          { year: 2023, month: 1, sentCount: 10, receivedCount: 5 },
          { year: 2023, month: 2, sentCount: 15, receivedCount: 8 }
        ]
      };

      const result = prepareCountsOverTimeData(data, false);

      expect(result.sortedMonths).toEqual(["2023-01", "2023-02"]);
      expect(result.counts["2023-01"]).toEqual([15]); // 10 + 5 = 15 cumulative
      expect(result.counts["2023-02"]).toEqual([38]); // 15 + 15 + 8 = 38 cumulative
      expect(result.globalMax).toBe(38);
    });

    it("should handle sentOnly mode", () => {
      const data = {
        "conv-1": [
          { year: 2023, month: 1, sentCount: 10, receivedCount: 5 },
          { year: 2023, month: 2, sentCount: 15, receivedCount: 8 }
        ]
      };

      const result = prepareCountsOverTimeData(data, true);

      expect(result.counts["2023-01"]).toEqual([10]); // Only sent
      expect(result.counts["2023-02"]).toEqual([25]); // 10 + 15 cumulative
      expect(result.globalMax).toBe(25);
    });

    it("should handle multiple conversations with gaps", () => {
      const data = {
        "conv-1": [
          { year: 2023, month: 1, sentCount: 10, receivedCount: 0 },
          { year: 2023, month: 3, sentCount: 5, receivedCount: 0 }
        ],
        "conv-2": [
          { year: 2023, month: 2, sentCount: 0, receivedCount: 20 },
          { year: 2023, month: 4, sentCount: 0, receivedCount: 10 }
        ]
      };

      const result = prepareCountsOverTimeData(data, false);

      expect(result.sortedMonths).toEqual(["2023-01", "2023-02", "2023-03", "2023-04"]);

      // conv-1: Jan=10, Feb=10 (gap filled), Mar=15, Apr=15 (gap filled)
      // conv-2: Jan=0 (gap filled), Feb=20, Mar=20 (gap filled), Apr=30
      expect(result.counts["2023-01"]).toEqual([10, 0]);
      expect(result.counts["2023-02"]).toEqual([10, 20]); // fillMissingMonths copies lastValues
      expect(result.counts["2023-03"]).toEqual([15, 20]);
      expect(result.counts["2023-04"]).toEqual([15, 30]);
    });

    it("should fill missing months with lastValues from fillMissingMonths", () => {
      const data = {
        "conv-1": [
          { year: 2023, month: 1, sentCount: 100, receivedCount: 50 }
          // No data for Feb, Mar
        ],
        "conv-2": [
          { year: 2023, month: 3, sentCount: 20, receivedCount: 10 }
          // No data for Jan, Feb
        ]
      };

      const result = prepareCountsOverTimeData(data, false);

      expect(result.sortedMonths).toEqual(["2023-01", "2023-03"]);

      // conv-1: Jan=150, Mar=150 (carried forward)
      // conv-2: Jan=0, Mar=30
      expect(result.counts["2023-01"]).toEqual([150, 0]);
      expect(result.counts["2023-03"]).toEqual([150, 30]); // conv-1 value carried forward
    });

    it("should calculate globalMax correctly across all conversations", () => {
      const data = {
        "conv-1": [{ year: 2023, month: 1, sentCount: 50, receivedCount: 50 }],
        "conv-2": [{ year: 2023, month: 1, sentCount: 100, receivedCount: 200 }]
      };

      const result = prepareCountsOverTimeData(data, false);

      // conv-2 has the max: 100 + 200 = 300
      expect(result.globalMax).toBe(300);
    });

    it("should handle empty conversation data", () => {
      const data = {};

      const result = prepareCountsOverTimeData(data, false);

      expect(result.sortedMonths).toEqual([]);
      expect(result.counts).toEqual({});
      expect(result.globalMax).toBe(0);
    });

    it("should handle conversation with no data points", () => {
      const data = {
        "conv-1": []
      };

      const result = prepareCountsOverTimeData(data, false);

      expect(result.sortedMonths).toEqual([]);
      expect(result.globalMax).toBe(0);
    });

    it("should sort data points within each conversation by year and month", () => {
      const data = {
        "conv-1": [
          { year: 2023, month: 3, sentCount: 5, receivedCount: 0 },
          { year: 2023, month: 1, sentCount: 10, receivedCount: 0 },
          { year: 2023, month: 2, sentCount: 15, receivedCount: 0 }
        ]
      };

      const result = prepareCountsOverTimeData(data, false);

      expect(result.sortedMonths).toEqual(["2023-01", "2023-02", "2023-03"]);
      // Cumulative should be based on sorted order: 10, 25, 30
      expect(result.counts["2023-01"]).toEqual([10]);
      expect(result.counts["2023-02"]).toEqual([25]);
      expect(result.counts["2023-03"]).toEqual([30]);
    });

    it("should create month keys in YYYY-MM format with zero-padding", () => {
      const data = {
        "conv-1": [
          { year: 2023, month: 1, sentCount: 5, receivedCount: 0 },
          { year: 2023, month: 12, sentCount: 10, receivedCount: 0 }
        ]
      };

      const result = prepareCountsOverTimeData(data, false);

      expect(result.sortedMonths).toContain("2023-01");
      expect(result.sortedMonths).toContain("2023-12");
      expect(result.counts).toHaveProperty("2023-01");
      expect(result.counts).toHaveProperty("2023-12");
    });

    it("should handle multiple conversations with overlapping months", () => {
      const data = {
        "conv-1": [
          { year: 2023, month: 1, sentCount: 10, receivedCount: 5 },
          { year: 2023, month: 2, sentCount: 20, receivedCount: 10 }
        ],
        "conv-2": [
          { year: 2023, month: 1, sentCount: 5, receivedCount: 3 },
          { year: 2023, month: 2, sentCount: 15, receivedCount: 7 }
        ]
      };

      const result = prepareCountsOverTimeData(data, false);

      expect(result.sortedMonths).toEqual(["2023-01", "2023-02"]);
      // conv-1: Jan=15, Feb=45
      // conv-2: Jan=8, Feb=30
      expect(result.counts["2023-01"]).toEqual([15, 8]);
      expect(result.counts["2023-02"]).toEqual([45, 30]);
      expect(result.globalMax).toBe(45);
    });
  });
});
