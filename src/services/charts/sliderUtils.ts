export interface SliderMark {
  value: number;
  label: string; // expected format: YYYY-MM
}

export function parseYearMonth(label: string): { year: number; month: number } {
  const [y, m] = label.split('-').map(Number);
  return { year: y, month: m };
}

export function monthDiff(startLabel: string, endLabel: string): number {
  const a = parseYearMonth(startLabel);
  const b = parseYearMonth(endLabel);
  return (b.year - a.year) * 12 + (b.month - a.month);
}

export function monthsBetweenInclusive(startLabel: string, endLabel: string): number {
  return monthDiff(startLabel, endLabel) + 1;
}

/**
 * Returns a sparsified subset of slider marks for labeling purposes only,
 * while preserving the full interactive range of the slider.
 *
 * Rules:
 * - If marks length <= maxLabels, returns marks unchanged.
 * - Always includes first and last marks.
 * - Distributes selected marks roughly evenly across the range.
 */
export function sparseMarks(all: SliderMark[], maxLabels: number): SliderMark[] {
  if (!Array.isArray(all) || all.length === 0) return [];
  if (maxLabels <= 0) return [];
  if (all.length <= maxLabels) return all;

  const n = all.length; // total months
  const lastIdx = n - 1;

  // Choose an aesthetically pleasing number of labels k (<= maxLabels)
  // Preferences:
  // 1) Use as many labels as possible while keeping even spacing exact if feasible: (n-1) % (k-1) == 0
  // 2) Avoid leaving exactly one unlabeled month (n - k != 1)
  // 3) Otherwise, still prefer more labels, but never the singleton-hole case
  let kCandidate = Math.min(maxLabels, n);

  // First pass: exact divisors of (n-1) with no singleton hole, maximizing k
  for (let k = kCandidate; k >= 2; k--) {
    if (n - k === 1) continue; // avoid single unlabeled month
    if (((n - 1) % (k - 1)) === 0) { kCandidate = k; break; }
  }

  // If we didn't find an exact divisor and we landed on a singleton hole, step down once
  if (n - kCandidate === 1) {
    kCandidate -= 1;
  }

  // Safety clamp: ensure at least 2 labels (first/last); prefer 3 when possible
  if (kCandidate < 2) kCandidate = Math.min(2, n);

  const gaps = kCandidate - 1;
  const totalSteps = lastIdx;
  const baseGap = Math.floor(totalSteps / Math.max(gaps, 1));
  const remainder = gaps > 0 ? (totalSteps % gaps) : 0; // first `remainder` gaps get +1

  const indices: number[] = [0];
  let current = 0;
  for (let i = 0; i < gaps; i++) {
    const inc = baseGap + (i < remainder ? 1 : 0);
    current += inc;
    indices.push(current);
  }

  // Map indices to marks (values align with indices in our usage)
  const result: SliderMark[] = indices.map((idx) => all[idx]);

  // Safety: Deduplicate by value while preserving order
  const seen = new Set<number>();
  return result.filter((mark) => {
    if (seen.has(mark.value)) return false;
    seen.add(mark.value);
    return true;
  });
}
