export type NumericDate = [number, number, number];

/**
 * Takes an array of numeric dates and tries to understand if the days come
 * before the month or the other way around by checking if numbers go above 12.
 *
 * @param numericDates Array of dates represented as arrays of numbers
 * @returns true if days are first, false if they are second, or null if it
 *          failed to understand the order
 */
function checkAbove12(numericDates: NumericDate[]): boolean | null {
  const daysFirst = numericDates.some(indexAboveValue(0, 12));
  if (daysFirst) return true;

  const daysSecond = numericDates.some(indexAboveValue(1, 12));
  if (daysSecond) return false;

  return null;
}

/**
 * Takes an array of numeric dates and tries to understand if the days come
 * before the month or the other way around by checking if a set of numbers
 * during the same year decrease at some point.
 *
 * @param numericDates Array of dates represented as arrays of numbers
 * @returns true if days are first, false if they are second, or null if it
 *          failed to understand the order
 */
function checkDecreasing(numericDates: NumericDate[]): boolean | null {
  const datesByYear: NumericDate[][] = groupArrayByValueAtIndex(numericDates, 2);

  const results = datesByYear.map((dates) => {
    const daysFirst = dates.slice(1).some((date, i) => {
      const [first1] = dates[i];
      const [first2] = date;
      return first2 < first1;
    });
    if (daysFirst) return true;

    const daysSecond = dates.slice(1).some((date, i) => {
      const [, second1] = dates[i];
      const [, second2] = date;
      return second2 < second1;
    });
    if (daysSecond) return false;

    return null;
  });

  const anyTrue = results.some((value) => value === true);
  if (anyTrue) return true;

  const anyFalse = results.some((value) => value === false);
  if (anyFalse) return false;

  return null;
}

/**
 * Takes an array of numeric dates and tries to understand if the days come
 * before the month or the other way around by looking at which number changes
 * more frequently.
 *
 * @param numericDates Array of dates represented as arrays of numbers
 * @returns true if days are first, false if they are second, or null if it
 *          failed to understand the order
 */
function changeFrequencyAnalysis(numericDates: NumericDate[]): boolean | null {
  const diffs = numericDates
    .slice(1)
    .map((date, i) => date.map((num, j) => Math.abs(numericDates[i][j] - num)));

  const [first, second] = diffs.reduce(
    ([firstSum, secondSum], diff) => {
      const [firstChange, secondChange] = diff;
      return [firstSum + firstChange, secondSum + secondChange];
    },
    [0, 0]
  );

  if (first > second) return true;
  if (first < second) return false;

  return null;
}

/**
 * Takes an array of numeric dates and tries to understand if the days come
 * before the month or the other way around by running the dates through all
 * checks (checkAbove12, checkDecreasing, changeFrequencyAnalysis).
 *
 * @param numericDates Array of dates represented as arrays of numbers
 * @returns true if days are first, false if they are second, or null if it
 *          failed to understand the order
 */
function daysBeforeMonths(numericDates: NumericDate[]): boolean | null {
  const firstCheck = checkAbove12(numericDates);
  if (firstCheck !== null) return firstCheck;

  const secondCheck = checkDecreasing(numericDates);
  if (secondCheck !== null) return secondCheck;

  return changeFrequencyAnalysis(numericDates);
}

/**
 * Pads year, month, and day strings to ensure consistent length and formatting.
 *
 * @param year String representation of the year
 * @param month String representation of the month
 * @param day String representation of the day
 * @returns Array of padded year, month, and day strings
 */
function normalizeDate(year: string, month: string, day: string): [string, string, string] {
  return [year.padStart(4, "2000"), month.padStart(2, "0"), day.padStart(2, "0")];
}

function indexAboveValue(index: number, value: number): (array: number[]) => boolean {
  return (array: number[]) => array[index] > value;
}

/**
 * Given an array of arrays and an index, groups the inner arrays by the value at the index provided.
 * See test cases for a better understanding of this function.
 */
function groupArrayByValueAtIndex<T extends any[]>(array: T[], index: number): T[][] {
  const map = new Map<string, T[]>();
  array.forEach((item) => {
    const key = item[index].toString();
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  });
  return Array.from(map.values());
}

export { daysBeforeMonths, normalizeDate };
