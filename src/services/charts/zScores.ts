import _ from "lodash";

/**
 * Calculates z-scores for a dataset, either flat or nested.
 *
 * For flat arrays, it returns an array of z-scores where each value is normalized
 * using the global mean and standard deviation of the dataset.
 * For nested structures (e.g., { [key]: number[] }), it computes z-scores for each
 * nested array while still using the global mean and standard deviation.
 *
 * Z-scores are clamped to the provided limit to prevent extreme values.
 *
 * @param data - A flat array of numbers or a nested object with arrays of numbers.
 * @param limit - The maximum absolute value for z-scores (e.g., 1.96 for a 95% confidence interval).
 * @returns The z-scores in the same structure as the input (array or nested object).
 */

export const calculateZScores = (
  data: number[] | Record<string, number[]>, // Accept either flat or nested data
  limit: number
): number[] | Record<string, number[]> => {
  // Flatten data for global calculations if needed
  const flatData = Array.isArray(data) ? data : Object.values(data).flat();

  const mean = _.mean(flatData);
  const stdDev = Math.sqrt(_.mean(flatData.map(val => Math.pow(val - mean, 2))));

  const applyZScores = (values: number[]) =>
    values.map(value => {
      let z = (value - mean) / stdDev;
      if (z > limit) z = limit;
      if (z < -limit) z = -limit;
      return z;
    });

  // Flat data
  if (Array.isArray(data)) {
    return applyZScores(data);
  }

  // Nested data
  const zScoresByMonth: Record<string, number[]> = {};
  for (const [key, values] of Object.entries(data)) {
    zScoresByMonth[key] = applyZScores(values);
  }

  return zScoresByMonth;
};
