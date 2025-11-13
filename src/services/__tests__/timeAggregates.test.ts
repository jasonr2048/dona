import {
  produceAllDays,
  getEpochSeconds,
  produceSlidingWindowMean,
} from "@services/charts/timeAggregates";
import { DailySentReceivedPoint } from "@models/graphData";
import { describe, expect, it } from "@jest/globals";

describe("timeAggregates", () => {
  describe("produceAllDays", () => {
    it("should generate a list of all days within the given date range", () => {
      const startDate = new Date(2023, 11, 1); // Dec 1, 2023
      const endDate = new Date(2023, 11, 5); // Dec 5, 2023

      const result = produceAllDays(startDate, endDate);

      expect(result).toEqual([
        { year: 2023, month: 12, date: 1 },
        { year: 2023, month: 12, date: 2 },
        { year: 2023, month: 12, date: 3 },
        { year: 2023, month: 12, date: 4 },
        { year: 2023, month: 12, date: 5 },
      ]);
    });

    it("should handle a single day range", () => {
      const startDate = new Date(2023, 11, 1); // Dec 1, 2023
      const endDate = new Date(2023, 11, 1); // Dec 1, 2023

      const result = produceAllDays(startDate, endDate);

      expect(result).toEqual([{ year: 2023, month: 12, date: 1 }]);
    });

    it("should handle a range spanning months", () => {
      const startDate = new Date(2023, 10, 30); // Nov 30, 2023
      const endDate = new Date(2023, 11, 2); // Dec 2, 2023

      const result = produceAllDays(startDate, endDate);

      expect(result).toEqual([
        { year: 2023, month: 11, date: 30 },
        { year: 2023, month: 12, date: 1 },
        { year: 2023, month: 12, date: 2 },
      ]);
    });

    it("should handle a range spanning years", () => {
      const startDate = new Date(2023, 11, 31); // Dec 31, 2023
      const endDate = new Date(2024, 0, 2); // Jan 2, 2024

      const result = produceAllDays(startDate, endDate);

      expect(result).toEqual([
        { year: 2023, month: 12, date: 31 },
        { year: 2024, month: 1, date: 1 },
        { year: 2024, month: 1, date: 2 },
      ]);
    });

    it("should return an empty array if start date is after end date", () => {
      const startDate = new Date(2023, 11, 5); // Dec 5, 2023
      const endDate = new Date(2023, 11, 1); // Dec 1, 2023

      const result = produceAllDays(startDate, endDate);

      expect(result).toEqual([]);
    });

    it("should handle leap years correctly", () => {
      const startDate = new Date(2024, 1, 28); // Feb 28, 2024
      const endDate = new Date(2024, 2, 1); // Mar 1, 2024

      const result = produceAllDays(startDate, endDate);

      expect(result).toEqual([
        { year: 2024, month: 2, date: 28 },
        { year: 2024, month: 2, date: 29 }, // Leap day
        { year: 2024, month: 3, date: 1 },
      ]);
    });
  });

  describe("produceSlidingWindowMean", () => {
    it("should compute sliding window means and skip zero means except for first and last days", () => {
      const dailyData: DailySentReceivedPoint[] = [
        {
          year: 2023,
          month: 12,
          date: 1,
          sentCount: 10,
          receivedCount: 20,
          epochSeconds: getEpochSeconds(2023, 12, 1),
        },
        {
          year: 2023,
          month: 12,
          date: 3,
          sentCount: 30,
          receivedCount: 40,
          epochSeconds: getEpochSeconds(2023, 12, 3),
        },
      ];

      const completeDays = [
        { year: 2023, month: 12, date: 1 },
        { year: 2023, month: 12, date: 2 },
        { year: 2023, month: 12, date: 3 },
      ];

      const result = produceSlidingWindowMean(dailyData, completeDays, 3);

      expect(result).toEqual([
        {
          year: 2023,
          month: 12,
          date: 1,
          sentCount: 5, // (10 + 0) / 2
          receivedCount: 10, // (20 + 0) / 2
          epochSeconds: getEpochSeconds(2023, 12, 1),
        },
        {
          year: 2023,
          month: 12,
          date: 2,
          sentCount: 13, // (10 + 0 + 30) / 3
          receivedCount: 20, // (20 + 0 + 40) / 3
          epochSeconds: getEpochSeconds(2023, 12, 2),
        },
        {
          year: 2023,
          month: 12,
          date: 3,
          sentCount: 15, // (0 + 30) / 2
          receivedCount: 20, // (0 + 40) / 2
          epochSeconds: getEpochSeconds(2023, 12, 3),
        },
      ]);
    });

    it("should skip days with zero means except for boundary days", () => {
      const dailyData: DailySentReceivedPoint[] = [
        {
          year: 2023,
          month: 12,
          date: 2,
          sentCount: 50,
          receivedCount: 100,
          epochSeconds: getEpochSeconds(2023, 12, 2),
        },
      ];

      const completeDays = [
        { year: 2023, month: 12, date: 1 },
        { year: 2023, month: 12, date: 2 },
        { year: 2023, month: 12, date: 3 },
      ];

      const result = produceSlidingWindowMean(dailyData, completeDays, 3);

      expect(result).toEqual([
        {
          year: 2023,
          month: 12,
          date: 1,
          sentCount: 25, // (0 + 50) / 2
          receivedCount: 50, // (0 + 100) / 2
          epochSeconds: getEpochSeconds(2023, 12, 1),
        },
        {
          year: 2023,
          month: 12,
          date: 2,
          sentCount: 17, // (0 + 50 + 0) / 3
          receivedCount: 33, // (0 + 100 + 0) / 3
          epochSeconds: getEpochSeconds(2023, 12, 2),
        },
        {
          year: 2023,
          month: 12,
          date: 3,
          sentCount: 25, // (50 + 0) / 2
          receivedCount: 50, // (100 + 0) / 2
          epochSeconds: getEpochSeconds(2023, 12, 3),
        },
      ]);
    });

    it("should skip days where means are zero and handle edge cases with partial data", () => {
      const dailyData: DailySentReceivedPoint[] = [
        {
          year: 2023,
          month: 11,
          date: 30,
          sentCount: 5,
          receivedCount: 15,
          epochSeconds: getEpochSeconds(2023, 11, 30),
        },
        {
          year: 2023,
          month: 12,
          date: 3,
          sentCount: 30,
          receivedCount: 40,
          epochSeconds: getEpochSeconds(2023, 12, 3),
        },
      ];

      const completeDays = [
        { year: 2023, month: 11, date: 30 },
        { year: 2023, month: 12, date: 1 },
        { year: 2023, month: 12, date: 2 },
        { year: 2023, month: 12, date: 3 },
      ];

      const result = produceSlidingWindowMean(dailyData, completeDays, 3);

      expect(result).toEqual([
        {
          year: 2023,
          month: 11,
          date: 30,
          sentCount: 3, // (5 + 0) / 2
          receivedCount: 8, // (15 + 0) / 2
          epochSeconds: getEpochSeconds(2023, 11, 30),
        },
        {
          year: 2023,
          month: 12,
          date: 1,
          sentCount: 2, // (5 + 0 + 0) / 3
          receivedCount: 5, // (15 + 0 + 0) / 3
          epochSeconds: getEpochSeconds(2023, 12, 1),
        },
        {
          year: 2023,
          month: 12,
          date: 2,
          sentCount: 10, // (0 + 0 + 30) / 3
          receivedCount: 13, // (0 + 0 + 40) / 3
          epochSeconds: getEpochSeconds(2023, 12, 2),
        },
        {
          year: 2023,
          month: 12,
          date: 3,
          sentCount: 15, // (0 + 30) / 2
          receivedCount: 20, // (0 + 40) / 2
          epochSeconds: getEpochSeconds(2023, 12, 3),
        },
      ]);
    });
  });
});
