import { describe, expect, it } from "vitest"

import { easeDraw, easeEnter } from "#src/util/motion/motion.ts"

import type { PlaneView } from "../../CartesianPlane/viewport.ts"
import type { PlaneSceneInput } from "../planeScene.ts"

import { DEFAULT_PARAMS } from "../math/form.ts"
import { buildPlaneScene } from "../planeScene.ts"
import {
  AT_REST,
  drawTimeOf,
  firstPaintAt,
  flashAt,
  ghostShareAt,
  isMoving,
  JUMP_S,
  jumpAt,
  landingAt,
  motionScene,
  nudgeAt,
  qEnterAt,
  qEnterTimeOf,
  qLeaveAt,
  settle,
  switchAt,
  type FvMotionLayers,
} from "./fvMotion.ts"

const percent = (v: number) => Math.round(v * 100)

/** A scene without its functions, which differ in identity from build to build. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value))

const BASE: PlaneSceneInput = {
  fn: "x2",
  params: DEFAULT_PARAMS,
  pX: 2,
  qX: null,
  ghostOn: true,
  pLit: false,
  active: null,
  handleLit: null,
  handleHeld: null,
  pWas: null,
}

/** R2's plane as it reports itself: 936 × 792 at 100 %. */
const R2_VIEW: PlaneView = { zoom: 50, extent: { minX: -9.36, maxX: 9.36, minY: -7.92, maxY: 7.92 } }

/** The Reset all filmstrip's start: 2((x + 1)/1.5)² + 1. */
const FROM = { a: 2, b: 1.5, h: -1, k: 1 }

describe("value jumps (FV 05 › Reset all filmstrip)", () => {
  it("springs a, b, h and k together: 28, 62, 82, 92, 99 % at 80 … 480 ms", () => {
    const frames = [0, 0.08, 0.16, 0.24, 0.32, 0.48].map((t) => jumpAt(FROM, DEFAULT_PARAMS, t))
    expect(frames.map((p) => percent((FROM.a - p.a) / (FROM.a - 1)))).toEqual([0, 28, 62, 82, 92, 99])
    // One spring: every parameter is the same share of its way.
    for (const p of frames) {
      expect((FROM.b - p.b) / 0.5).toBeCloseTo((FROM.a - p.a) / 1, 12)
      expect((p.h - FROM.h) / 1).toBeCloseTo((FROM.k - p.k) / 1, 12)
    }
  })

  it("lands exactly when the spring has settled", () => {
    expect(JUMP_S).toBeCloseTo(0.702, 3)
    expect(jumpAt(FROM, DEFAULT_PARAMS, JUMP_S)).toBe(DEFAULT_PARAMS)
  })
})

describe("function switch (FV 05 › x² → sin x filmstrip)", () => {
  it("draws the new curve 0, 3, 15, 50, 85, 100 % at 0 … 900 ms, the old one gone by 160", () => {
    const frames = [0, 0.16, 0.3, 0.45, 0.6, 0.9].map(switchAt)
    expect(frames.map((f) => percent(f.trim))).toEqual([0, 3, 15, 50, 85, 100])
    expect(switchAt(0).old).toBe(1)
    expect(switchAt(0.08).old).toBeCloseTo(0.5, 9)
    expect(switchAt(0.16).old).toBe(0)
  })

  it("lands a mark as the pen passes it, on the enter spring", () => {
    expect(drawTimeOf(0.5)).toBeCloseTo(0.45, 6)
    expect(drawTimeOf(0)).toBe(0)
    expect(drawTimeOf(1)).toBe(0.9)
    expect(landingAt(0.45, 0.5)).toBe(0)
    expect(landingAt(0.53, 0.5)).toBeCloseTo(Math.min(1, easeEnter.ease(0.5)), 6)
    expect(landingAt(0.61, 0.5)).toBe(1)
  })

  it("lands P at x = 1 on sin x between the filmstrip's 450 and 600 ms frames", () => {
    const layers: FvMotionLayers = { ...AT_REST, switch: { fn: "x2", params: DEFAULT_PARAMS, start: 0 } }
    const input = { ...BASE, fn: "sin" as const, pX: 1 }
    const pAt = (t: number) => motionScene(input, layers, t, R2_VIEW, "full").points[0]?.alpha ?? 1
    expect(pAt(0.45)).toBe(0)
    expect(pAt(0.6)).toBeGreaterThan(0.9)
  })
})

describe("first paint (FV 05 › Draw-on timeline)", () => {
  it("fades the grid in, draws the curve, then P and its label arrive", () => {
    expect(firstPaintAt(0.15).grid).toBeCloseTo(easeDraw(0.375), 9)
    expect(firstPaintAt(0.4).grid).toBe(1)
    expect(firstPaintAt(0.35).trim).toBe(0)
    expect(firstPaintAt(0.8).trim).toBeCloseTo(0.5, 9)
    expect(firstPaintAt(1.25).trim).toBe(1)
    expect(firstPaintAt(1.15).p).toBe(0)
    expect(firstPaintAt(1.31).p).toBe(1)
    expect(firstPaintAt(1.3)).toMatchObject({ label: 0, rise: 8 })
    expect(firstPaintAt(1.62)).toMatchObject({ label: 1, rise: 0 })
  })

  it("nudges each ruler 10 px left and back, 60 ms after the one before", () => {
    expect(nudgeAt(1.7, 0)).toBe(0)
    expect(nudgeAt(1.95, 0)).toBe(-10)
    expect(nudgeAt(2.3, 0)).toBe(0)
    // The fourth ruler starts 180 ms later: at 1.95 s it is on its way out.
    expect(nudgeAt(1.95, 3)).toBeCloseTo(-10 * easeEnter.ease(0.07 / 0.25), 9)
    expect(nudgeAt(2.55, 3)).toBe(0)
    // The enter spring overshoots a little on the way out.
    expect(Math.min(...[1.8, 1.85, 1.9].map((t) => nudgeAt(t, 0)))).toBeLessThan(-10)
  })

  it("draws a frame of it: the grid faint, the curve part way, P and the handles not yet in", () => {
    const layers: FvMotionLayers = { ...AT_REST, paint: 0 }
    const at15 = motionScene(BASE, layers, 0.15, R2_VIEW, "full")
    expect(at15.gridAlpha).toBeCloseTo(easeDraw(0.375), 9)
    expect(at15.curves.find((c) => c.id === "f")?.drawTo).toBe(0)
    const at80 = motionScene(BASE, layers, 0.8, R2_VIEW, "full")
    expect(at80.gridAlpha).toBeUndefined()
    expect(at80.curves.find((c) => c.id === "f")?.drawTo).toBeCloseTo(0.5, 9)
    expect(at80.points[0]?.alpha).toBe(0)
    expect(at80.handles?.map((h) => h.alpha)).toEqual([0, 0])
    // 50 ms into the label's 320 ms: P is in, the label part way up.
    const at135 = motionScene(BASE, layers, 1.35, R2_VIEW, "full")
    expect(at135.points[0]?.alpha).toBeUndefined()
    expect(at135.points[0]?.labelAlpha).toBeCloseTo(0.59, 2)
    expect(at135.points[0]?.labelRise).toBeCloseTo(8 * 0.41, 1)
  })
})

describe("Q (FV 05 › pointer enters and leaves the plane)", () => {
  it("fades in in 160 ms and grows its drop lines in 120 ms", () => {
    expect(qEnterAt(0, "full")).toEqual({ alpha: 0, reach: 0 })
    expect(qEnterAt(0.12, "full").reach).toBe(1)
    expect(qEnterAt(0.16, "full")).toEqual({ alpha: 1, reach: 1 })
    expect(qEnterAt(qEnterTimeOf(0.5), "full").alpha).toBeCloseTo(0.5, 6)
  })

  it("leaves the same way reversed, linearly, in 120 ms", () => {
    expect(qLeaveAt(0.06, 1, "full")).toEqual({ alpha: 0.5, reach: 0.5 })
    expect(qLeaveAt(0.12, 1, "full").alpha).toBe(0)
  })

  it("only fades under reduced motion, 120 ms", () => {
    expect(qEnterAt(0.06, "reduced")).toEqual({ alpha: 0.5, reach: 1 })
    expect(qLeaveAt(0.06, 1, "reduced")).toEqual({ alpha: 0.5, reach: 1 })
  })

  it("draws a leaving Q where it was, its guide fading with it", () => {
    const layers: FvMotionLayers = { ...AT_REST, q: { dir: "out", x: -1.5, from: 1, start: 0 } }
    const scene = motionScene(BASE, layers, 0.06, R2_VIEW, "full")
    expect(scene.points[1]).toMatchObject({ id: "q", x: -1.5, y: 2.25, alpha: 0.5, reach: 0.5 })
    expect(scene.guides).toEqual([{ kind: "pointer-x", x: -1.5, alpha: 0.5 }])
  })
})

describe("the Original, the term flash", () => {
  it("fades the ghost 0 ↔ 75 % in 160 ms", () => {
    expect(ghostShareAt(0.08, 1, 0, "full")).toBeCloseTo(0.5, 9)
    expect(ghostShareAt(0.06, 0, 1, "reduced")).toBeCloseTo(0.5, 9)
    const layers: FvMotionLayers = { ...AT_REST, ghost: { from: 1, to: 0, start: 0 } }
    const input = { ...BASE, params: FROM, ghostOn: false }
    const scene = motionScene(input, layers, 0.08, R2_VIEW, "full")
    expect(scene.curves.find((c) => c.id === "original")?.alpha).toBeCloseTo(0.375, 9)
    expect(motionScene(input, AT_REST, 0, R2_VIEW, "full").curves.map((c) => c.id)).toEqual(["f"])
  })

  it("flashes a changed term in 80 ms, holds, and lets go by 600 ms", () => {
    expect(flashAt(0, "full")).toBe(0)
    expect(flashAt(0.2, "full")).toBe(1)
    expect(flashAt(0.45, "full")).toBeCloseTo(0.5, 9)
    expect(flashAt(0.6, "full")).toBe(0)
    expect(flashAt(0.54, "reduced")).toBeCloseTo(0.5, 9)
  })
})

describe("motionScene and the layers", () => {
  it("draws the view's own scene at rest", () => {
    expect(plain(motionScene(BASE, AT_REST, 5, R2_VIEW, "full"))).toEqual(plain(buildPlaneScene(BASE)))
    const r3 = { ...BASE, params: FROM, qX: -2 }
    const scene = motionScene(r3, AT_REST, 5, R2_VIEW, "full")
    expect(plain(scene)).toEqual(plain(buildPlaneScene(r3)))
    expect(scene.curves.find((c) => c.id === "f")?.fn(-1)).toBe(1)
  })

  it("keeps the Original through Reset all until the curve lands on it", () => {
    const layers: FvMotionLayers = { ...AT_REST, jump: { from: FROM, to: DEFAULT_PARAMS, start: 0 } }
    const mid = motionScene(BASE, layers, 0.16, R2_VIEW, "full")
    expect(mid.curves.map((c) => c.id)).toEqual(["original", "f"])
    // P keeps x = 2 and rides the curve down (D15).
    const p = mid.points[0]
    expect(p?.x).toBe(2)
    expect(p?.y).toBeCloseTo(mid.curves[1]?.fn(2) ?? Number.NaN, 12)
  })

  it("fades the old curve under the new one's draw-on", () => {
    const layers: FvMotionLayers = { ...AT_REST, switch: { fn: "x2", params: DEFAULT_PARAMS, start: 0 } }
    const scene = motionScene({ ...BASE, fn: "sin" }, layers, 0.08, R2_VIEW, "full")
    expect(scene.curves.map((c) => [c.id, c.alpha, c.drawTo])).toEqual([
      ["f-old", 0.5, undefined],
      ["f", undefined, easeDraw(0.08 / 0.9)],
    ])
  })

  it("settles each layer once it has run", () => {
    const layers: FvMotionLayers = {
      paint: 0,
      jump: { from: FROM, to: DEFAULT_PARAMS, start: 0 },
      switch: { fn: "x2", params: DEFAULT_PARAMS, start: 0 },
      q: { dir: "in", x: 0, from: 0, start: 0 },
      ghost: { from: 0, to: 1, start: 0 },
    }
    expect(settle(layers, 0.1, "full")).toEqual(layers)
    expect(settle(layers, 0.2, "full")).toMatchObject({ q: null, ghost: null })
    expect(settle(layers, 0.8, "full")).toMatchObject({ jump: null, switch: layers.switch })
    expect(settle(layers, 1.1, "full").switch).toBeNull()
    expect(isMoving(settle(layers, 2.6, "full"))).toBe(false)
    expect(isMoving(settle(layers, 2.5, "full"))).toBe(true)
  })
})
