/** A browser's matchMedia that prefers motion (or not). */
export const motionMedia = (reduce: boolean) => (query: string) =>
  ({ matches: reduce && query.includes("reduce"), media: query }) as MediaQueryList

/** A CSS `linear()` easing with evenly spaced stops, as `cssLinear` writes them, at `progress`. */
export const runLinear = (easing: string, progress: number): number => {
  const stops = easing.slice("linear(".length, -1).split(",").map(Number)
  const at = Math.min(1, Math.max(0, progress)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(at))
  const from = stops[i] ?? 1
  return from + ((stops[i + 1] ?? from) - from) * (at - i)
}
