/**
 * Where a key moves a radio group's choice (APG Radio Group): ← ↑ to the
 * previous, → ↓ to the next, Home and End to the ends. The previous of the
 * first is -1 and the next of the last is `last + 1`: the caller wraps.
 */
export const keyTarget = (key: string, from: number, last: number): number | undefined => {
  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return from - 1
    case "ArrowRight":
    case "ArrowDown":
      return from + 1
    case "Home":
      return 0
    case "End":
      return last
    default:
      return undefined
  }
}
