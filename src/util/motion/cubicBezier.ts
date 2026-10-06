// CSS cubic-bezier() as a function, for GSAP eases that must match the CSS
// timing function of the same name.

const NEWTON_STEPS = 8
const BISECT_STEPS = 40
const EPSILON = 1e-7

/** Progress 0 … 1 → eased value, the curve CSS draws for cubic-bezier(x1, y1, x2, y2). */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number): ((progress: number) => number) => {
  // Bernstein form with the end points at (0, 0) and (1, 1).
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  // The curve parameter whose x is `x`: Newton first, bisection when the
  // slope is too flat for Newton to converge.
  const solveT = (x: number): number => {
    let t = x
    for (let i = 0; i < NEWTON_STEPS; i++) {
      const err = sampleX(t) - x
      if (Math.abs(err) < EPSILON) {
        return t
      }
      const slope = slopeX(t)
      if (Math.abs(slope) < 1e-6) {
        break
      }
      t -= err / slope
    }
    let lo = 0
    let hi = 1
    t = x
    for (let i = 0; i < BISECT_STEPS; i++) {
      const value = sampleX(t)
      if (Math.abs(value - x) < EPSILON) {
        return t
      }
      if (value < x) {
        lo = t
      } else {
        hi = t
      }
      t = (lo + hi) / 2
    }
    return t
  }

  return (progress) => {
    if (progress <= 0) {
      return 0
    }
    if (progress >= 1) {
      return 1
    }
    return sampleY(solveT(progress))
  }
}
