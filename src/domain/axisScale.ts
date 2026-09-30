export interface AxisScale {
  /** Upper bound of the domain; the lower bound is always 0. */
  max: number;
  ticks: readonly number[];
}

const NICE_FACTORS = [1, 2, 5, 10] as const;

/** Smallest integer step of the form {1, 2, 5} × 10ⁿ that is at least `rawStep`. */
function niceIntegerStep(rawStep: number): number {
  if (rawStep <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const factor = NICE_FACTORS.find((candidate) => candidate * magnitude >= rawStep) ?? 10;
  return factor * magnitude;
}

/**
 * Zero-based integer scale whose rounded upper bound covers `maxValue`.
 * Aims for about `targetIntervals` gridlines; an all-zero input still yields a usable [0, 1] domain.
 */
export function getAxisScale(maxValue: number, targetIntervals = 4): AxisScale {
  const step = niceIntegerStep(Math.max(maxValue, 0) / targetIntervals);
  const max = Math.max(step, Math.ceil(maxValue / step) * step);
  const ticks = Array.from({ length: max / step + 1 }, (_, index) => index * step);
  return { max, ticks };
}
