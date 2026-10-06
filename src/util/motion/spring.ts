// Damped springs in closed form, so a GSAP tween can follow the physics the
// design specifies (figma0 FV 05; motion.dev spring { mass, stiffness,
// damping }) without a simulation loop.

export type Spring = {
  mass: number
  stiffness: number
  damping: number
}

/** Position at `t` seconds of a spring released at 0 towards 1 from rest. */
export const springAt = ({ mass, stiffness, damping }: Spring, t: number): number => {
  if (t <= 0) {
    return 0
  }
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  if (Math.abs(zeta - 1) < 1e-9) {
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
  }
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    const decay = zeta * w0
    return 1 - Math.exp(-decay * t) * (Math.cos(wd * t) + (decay / wd) * Math.sin(wd * t))
  }
  const root = w0 * Math.sqrt(zeta * zeta - 1)
  const r1 = -zeta * w0 + root
  const r2 = -zeta * w0 - root
  return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2)
}

const SETTLE_STEP_S = 0.001
const SETTLE_LIMIT_S = 10

/**
 * Seconds until the spring stays within `epsilon` of its target. 0.1 % by
 * default, so a tween of this length ends without a visible jump.
 */
export const settleTime = (spring: Spring, epsilon = 0.001): number => {
  let lastOutside = 0
  for (let t = SETTLE_STEP_S; t < SETTLE_LIMIT_S; t += SETTLE_STEP_S) {
    if (Math.abs(1 - springAt(spring, t)) > epsilon) {
      lastOutside = t
    }
  }
  return Number((lastOutside + SETTLE_STEP_S).toFixed(3))
}

export type SpringEase = {
  /** Progress 0 … 1 → position, for GSAP's `ease` or a CSS `linear()` easing. */
  ease: (progress: number) => number
  /** The spring's own duration in seconds: tween this long to keep the physics. */
  settle: number
}

/**
 * The spring as an ease over its settle time. Tweened for `settle` seconds it
 * moves exactly as the spring does; tweened for a token duration it keeps the
 * spring's shape, faster or slower.
 */
export const springEase = (spring: Spring): SpringEase => {
  const settle = settleTime(spring)
  return {
    ease: (progress) => (progress >= 1 ? 1 : springAt(spring, progress * settle)),
    settle,
  }
}
