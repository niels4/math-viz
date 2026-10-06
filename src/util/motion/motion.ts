import type { CSSProperties } from "react"

import type { Spring } from "./spring.ts"

import { cubicBezier } from "./cubicBezier.ts"
import { springEase } from "./spring.ts"

// Motion tokens (figma0 250 Motion v2 › motion/*), timed by the Function
// Viewer's FV 05 sheet. GSAP and CSS read them from here only.

export const DURATION_MS = {
  /** Hover, chip toggle, crosshair, fades. */
  fast: 160,
  /** Badge and chrome entrances. */
  base: 320,
  /** Curve draw-on (path trim 0 → 1). */
  draw: 900,
  /** Between siblings in a staged entrance. */
  stagger: 80,
  /** Things leaving: Q and its card's values (FV 05 › Pointer leaves the plane), an overlay closing. */
  leave: 120,
} as const

/** Under prefers-reduced-motion: no interpolation, no draw-on, no nudge; fades at most this long. */
export const REDUCED_FADE_MS = 120

/** Value jumps and pans: critically damped, so a measurement never wobbles. */
export const SPRING_SWEEP: Spring = { mass: 1, stiffness: 170, damping: 26 }

/** Things arriving (points, badges, chrome): ζ 0.68, a hint of overshoot. */
export const SPRING_ENTER: Spring = { mass: 1, stiffness: 260, damping: 22 }

/** Ink being drawn (grid fade, curve draw-on): symmetric ease-in-out. */
export const EASE_DRAW_BEZIER = [0.65, 0, 0.35, 1] as const

export const easeSweep = springEase(SPRING_SWEEP)
export const easeEnter = springEase(SPRING_ENTER)
export const easeDraw = cubicBezier(...EASE_DRAW_BEZIER)

/**
 * How much motion to show: full; reduced (prefers-reduced-motion: fades of
 * at most REDUCED_FADE_MS, nothing that travels); or none where there is no
 * matchMedia (jsdom, a server render), which has no frames to show it in.
 */
export type MotionLevel = "full" | "reduced" | "none"

export const motionLevel = (): MotionLevel =>
  typeof matchMedia !== "function"
    ? "none"
    : matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "reduced"
      : "full"

export const prefersReducedMotion = (): boolean => motionLevel() !== "full"

/** An ease as a CSS `linear()` timing function, sampled evenly (springs included, overshoot kept). */
export const cssLinear = (ease: (progress: number) => number, samples = 32): string => {
  const stops = Array.from({ length: samples + 1 }, (_, i) => String(Number(ease(i / samples).toFixed(4))))
  return `linear(${stops.join(", ")})`
}

/** The tokens as custom properties for a view root, so CSS transitions share them with GSAP. */
export const motionCssVars = {
  "--motion-dur-fast": `${DURATION_MS.fast}ms`,
  "--motion-dur-base": `${DURATION_MS.base}ms`,
  "--motion-dur-draw": `${DURATION_MS.draw}ms`,
  "--motion-stagger": `${DURATION_MS.stagger}ms`,
  "--motion-dur-leave": `${DURATION_MS.leave}ms`,
  "--motion-dur-reduced-fade": `${REDUCED_FADE_MS}ms`,
  "--motion-ease-draw": `cubic-bezier(${EASE_DRAW_BEZIER.join(", ")})`,
  "--motion-ease-enter": cssLinear(easeEnter.ease),
  "--motion-ease-sweep": cssLinear(easeSweep.ease),
} as CSSProperties
