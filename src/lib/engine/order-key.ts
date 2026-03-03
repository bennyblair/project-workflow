/**
 * Compute a midpoint orderKey for inserting between two neighbors.
 * If before is null, insert at the beginning (half of after).
 * If after is null, insert at the end (before + 1000).
 */
export function midpointOrderKey(
  before: number | null,
  after: number | null,
): number {
  if (before === null && after === null) return 1000;
  if (before === null) return (after as number) / 2;
  if (after === null) return before + 1000;
  return (before + after) / 2;
}
