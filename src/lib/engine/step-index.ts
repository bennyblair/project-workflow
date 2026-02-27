/**
 * Compute the step index for an ACTIVE ticket based on elapsed time.
 *
 * stepIndex 0 = newest (just started), maxSteps-1 = oldest (near expiry).
 * Rendered with 0 at bottom, maxSteps-1 at top.
 */
export function computeStepIndex(
  startedAt: Date | string,
  stepIntervalSeconds: number,
  maxSteps: number,
): number {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const elapsedSeconds = (Date.now() - start.getTime()) / 1000;
  const raw = Math.floor(elapsedSeconds / stepIntervalSeconds);
  return Math.max(0, Math.min(raw, maxSteps - 1));
}
