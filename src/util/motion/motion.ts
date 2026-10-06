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
  /** Things leaving: Q and its card's values (FV 05 › Pointer leaves the plane). */
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
 * The enter spring at its own pace (643 ms, its settle time), as FV 05 runs
 * its springs: in place by 200 ms, 5 % over at 270 ms, within 1 % by 410 ms.
 * Squeezed into dur-base it puts 90 % of its change in the first 80 ms, which
 * reads as a pop on anything as large as a menu.
 */
export const ENTER_SETTLE_MS = Math.round(easeEnter.settle * 1000)

/**
 * An overlay leaving: the settings menu, the explainer and the tour card (no
 * board draws it). Linear, as things leave in FV 05, and long enough to be
 * seen going; dur-leave's 120 ms reads as a blink on a card that size.
 */
export const OVERLAY_LEAVE_MS = 200

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

/** How long an overlay stays on its way out: as long as its CSS takes to leave. */
export const overlayLeaveMs = (): number => {
  const level = motionLevel()
  return level === "none" ? 0 : level === "reduced" ? REDUCED_FADE_MS : OVERLAY_LEAVE_MS
}

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
  "--motion-dur-enter-settle": `${ENTER_SETTLE_MS}ms`,
  "--motion-dur-overlay-leave": `${OVERLAY_LEAVE_MS}ms`,
  "--motion-dur-reduced-fade": `${REDUCED_FADE_MS}ms`,
  "--motion-ease-draw": `cubic-bezier(${EASE_DRAW_BEZIER.join(", ")})`,
  "--motion-ease-enter": cssLinear(easeEnter.ease),
  "--motion-ease-sweep": cssLinear(easeSweep.ease),
} as CSSProperties
