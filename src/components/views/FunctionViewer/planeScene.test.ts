import { describe, expect, it } from "vitest"

import type { ThemeVars } from "#src/state/useAppTheme.ts"

import type { CanvasFace } from "../CartesianPlane/faces.ts"
import type { Rect } from "../CartesianPlane/rect.ts"
import type { PlaneScene } from "../CartesianPlane/scene.ts"
import type { PlaneSceneInput } from "./planeScene.ts"

import { drawCartesianPlane } from "../CartesianPlane/drawCartesianPlane.ts"
import { readoutFaces } from "../CartesianPlane/faces.ts"
import { layoutMarks } from "../CartesianPlane/marks.ts"
import { intersects } from "../CartesianPlane/rect.ts"
import { makeViewport } from "../CartesianPlane/viewport.ts"
import { BASE_FUNCTION_SLUGS } from "./math/baseFunctions.ts"
import { DEFAULT_PARAMS } from "./math/form.ts"
import { buildPlaneScene } from "./planeScene.ts"

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
const R3 = { a: 2, b: 1, h: -1, k: 1 }

// R2's plane, 936 × 792 at 50 px per unit; Roboto Mono advances.
const vp = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, panX: 0, panY: 0 })
const opts = {
  measure: (face: CanvasFace, text: string) => text.length * 0.6 * face.size,
  readout: readoutFaces(`"Roboto Mono", monospace`),
  plates: [],
  corners: [],
}

/** The scene drawn on R2's plane: the grid it laid out, and every text it printed. */
const draw = (scene: PlaneScene) => {
  const texts: string[] = []
  // A context that only records its text (jsdom has no canvas).
  const ctx = new Proxy({} as CanvasRenderingContext2D, {
    get: (_, key) =>
      key === "measureText"
        ? (text: string) => ({ width: text.length * 8 })
        : key === "fillText"
          ? (text: string) => texts.push(text)
          : () => {},
    set: () => true,
  })
  const themeVars = new Proxy({} as ThemeVars, { get: (_, key) => (key === "glowRadius" ? 0 : "#000") })
  const marks = layoutMarks(scene, vp, opts)
  const grid = drawCartesianPlane({
    ctx,
    themeVars,
    width: 936,
    height: 792,
    dpr: 1,
    zoom: 50,
    panX: 0,
    panY: 0,
    scene,
    marks,
    keepOut: [],
  })
  const ticks = (axis: "x" | "y") => grid?.labels.filter((l) => l.axis === axis).map((l) => l.text) ?? []
  return { texts, ticks }
}

describe("buildPlaneScene", () => {
  it("draws R1/R2's defaults: the curve, P named and draggable, no ghost (D7: no transform)", () => {
    const scene = buildPlaneScene(BASE)
    expect(scene.curves.map((c) => c.id)).toEqual(["f"])
    expect(scene.curves[0]).toMatchObject({ ink: "chartLine", width: 3.5, glow: true })
    expect(scene.points).toEqual([
      {
        id: "p",
        x: 2,
        y: 4,
        style: "bullseye",
        ink: "chartPoint1",
        name: "P",
        labelPlace: "fixed",
        focus: false,
        dropLines: false,
        edgeMarker: true,
        draggable: true,
      },
    ])
    expect(scene.guides).toEqual([])
  })

  it("draws the ghost original under the curve once a transform is set (R3)", () => {
    const scene = buildPlaneScene({ ...BASE, params: R3, pX: 0.5 })
    expect(scene.curves.map((c) => c.id)).toEqual(["original", "f"])
    const [ghost, f] = scene.curves
    expect(ghost).toMatchObject({ ink: "foregroundMuted", width: 2, dash: [6, 6], alpha: 0.75, back: true })
    // The untransformed g: x², vertex at the origin; f is R3's.
    expect(ghost?.fn(2)).toBe(4)
    expect(f?.fn(0.5)).toBe(5.5)
    expect(buildPlaneScene({ ...BASE, params: R3, ghostOn: false }).curves.map((c) => c.id)).toEqual(["f"])
  })

  it("follows the pointer with Q: its guide and drop lines, painted after P (R2, R4)", () => {
    const scene = buildPlaneScene({ ...BASE, qX: -1.5 })
    expect(scene.points.map((p) => p.id)).toEqual(["p", "q"])
    expect(scene.points[1]).toMatchObject({
      x: -1.5,
      y: 2.25,
      style: "ring",
      ink: "chartPoint2",
      name: "Q",
      labelPlace: "fixed",
      dropLines: true,
      edgeMarker: true,
    })
    expect(scene.points[1]?.draggable).toBeUndefined()
    expect(scene.guides).toEqual([{ kind: "pointer-x", x: -1.5 }])
  })

  it("lights P with its halo and its drop lines (FV 04 › Y1)", () => {
    expect(buildPlaneScene({ ...BASE, pLit: true }).points[0]).toMatchObject({ focus: true, dropLines: true })
  })

  it("puts the anchor ◆ on (h, k) and the stretch grip ■ on the unit point (D21, D14)", () => {
    expect(buildPlaneScene({ ...BASE, params: R3 }).handles).toEqual([
      { id: "anchor", x: -1, y: 1, shape: "diamond", ink: "primary", halo: false, held: false },
      { id: "stretch", x: 0, y: 3, shape: "square", ink: "primary", halo: false, held: false },
    ])
    // sin's grip sits at π/2 across (D14); the anchor dragged holds it.
    const sin = buildPlaneScene({ ...BASE, fn: "sin", handleLit: "anchor", handleHeld: "anchor" })
    expect(sin.handles?.[1]).toMatchObject({ x: Math.PI / 2, y: 1 })
    expect(sin.handles?.[0]).toMatchObject({ halo: true, held: true })
  })

  it("draws nothing for a value while none is active", () => {
    expect(buildPlaneScene({ ...BASE, params: R3 }).annotations).toEqual([])
  })

  it("draws k from y = 0 to y = k at x = h, under the curve (R5)", () => {
    const [k] = buildPlaneScene({ ...BASE, params: R3, active: "k" }).annotations ?? []
    expect(k).toEqual({
      layer: "under",
      ink: "primary",
      lines: [{ from: { x: -1, y: 0 }, to: { x: -1, y: 1 }, width: 2.5, startTick: 9, arrow: true }],
    })
  })

  it("draws h from x = 0 to x = h at y = k (FV 02 › H3)", () => {
    const [h] = buildPlaneScene({ ...BASE, params: R3, active: "h" }).annotations ?? []
    expect(h?.lines).toEqual([
      { from: { x: 0, y: 1 }, to: { x: -1, y: 1 }, width: 2.5, startTick: 9, arrow: true },
    ])
  })

  it("draws a and b as the unit box's sides from the anchor to the unit point (R7, FV 04)", () => {
    const [a] = buildPlaneScene({ ...BASE, params: R3, active: "a" }).annotations ?? []
    // Four dashed sides at 80 %, then a's: from (0, 1) up to the unit point (0, 3), with end ticks.
    expect(a?.lines).toHaveLength(5)
    expect(a?.lines.slice(0, 4).every((l) => l.dash !== undefined && l.alpha === 0.8)).toBe(true)
    expect(a?.lines[4]).toEqual({ from: { x: 0, y: 1 }, to: { x: 0, y: 3 }, width: 3, endTicks: 7 })
    const [b] = buildPlaneScene({ ...BASE, params: R3, active: "b" }).annotations ?? []
    expect(b?.lines[4]).toEqual({ from: { x: -1, y: 1 }, to: { x: 0, y: 1 }, width: 3, endTicks: 7 })
  })

  it("drops a dragged anchor's h and k onto the axes, over the curve (R6)", () => {
    const params = { a: 2, b: 1, h: 1.5, k: 1 }
    const [anchor] = buildPlaneScene({ ...BASE, params, active: "anchor" }).annotations ?? []
    expect(anchor?.layer).toBe("over")
    expect(anchor?.lines).toEqual([
      { from: { x: 0, y: 1 }, to: { x: 1.5, y: 1 }, width: 1.5, dash: [5, 4] },
      { from: { x: 1.5, y: 1 }, to: { x: 1.5, y: 0 }, width: 1.5, dash: [5, 4] },
    ])
  })

  it("draws a dragged stretch grip's unit box with both sides (FV 11 › G3)", () => {
    const params = { a: 2, b: 1.5, h: -1, k: 1 }
    const [box] = buildPlaneScene({ ...BASE, params, active: "stretch" }).annotations ?? []
    expect(box?.layer).toBe("over")
    expect(box?.lines.slice(4)).toEqual([
      { from: { x: -1, y: 1 }, to: { x: 0.5, y: 1 }, width: 3 },
      { from: { x: 0.5, y: 1 }, to: { x: 0.5, y: 3 }, width: 3 },
    ])
  })

  it("marks where a transform's drag found P, with an arrow in --primary (R5)", () => {
    const [p] = buildPlaneScene({ ...BASE, params: R3, pX: 0.5, pWas: 4.5 }).points
    expect(p?.was).toEqual({ x: 0.5, y: 4.5, ink: "primary" })
  })
})

describe("P's and Q's labels, and no axis tags (the user's rulings, 2026-10-07 and 2026-10-08)", () => {
  /** Checks a label up-right of its point, 22 px out, or held 12 px inside the plane; true when held. */
  const held = (point: { x: number; y: number }, box: Rect): boolean => {
    const rest = { x: point.x + 22, y: point.y - 13.2 - box.h }
    expect(box.x).toBeCloseTo(Math.min(rest.x, 936 - 12 - box.w), 9)
    expect(box.y).toBeCloseTo(Math.max(rest.y, 12), 9)
    return box.x !== rest.x || Math.abs(box.y - rest.y) > 1e-9
  }
  /** The scene with one point's label where it used to go: the first spot clear of the curve and the marks. */
  const placedClear = (scene: PlaneScene, id: string): PlaneScene => ({
    ...scene,
    curves: scene.curves.map((c) => (c.id === "f" ? { ...c, avoid: true } : c)),
    points: scene.points.map((p) => (p.id === id ? { ...p, labelPlace: "clear" as const } : p)),
  })
  const elsewhere = (before: Rect | undefined, box: Rect) =>
    before !== undefined && (before.x !== box.x || before.y !== box.y)

  it("holds P's up-right of P, 22 px out, whatever the curve, the transforms and the marks, moving only at the plane's edges", () => {
    let places = 0
    let atEdge = 0
    let movedBefore = 0
    for (const fn of BASE_FUNCTION_SLUGS) {
      for (const params of [DEFAULT_PARAMS, R3]) {
        for (const active of [null, "anchor"] as const) {
          for (let pX = -9; pX <= 9; pX += 0.5) {
            // P lit (its drop lines out), or Q's marker and drop lines beside it.
            for (const qX of [null, pX + 0.3]) {
              const scene = buildPlaneScene({ ...BASE, fn, params, pX, qX, active, pLit: qX === null })
              const p = layoutMarks(scene, vp, opts).points[0]
              if (p?.marker == null || p.label === null) {
                continue
              }
              places++
              if (held(p.marker, p.label.box)) {
                atEdge++
              }
              if (
                elsewhere(layoutMarks(placedClear(scene, "p"), vp, opts).points[0]?.label?.box, p.label.box)
              ) {
                movedBefore++
              }
            }
          }
        }
      }
    }
    // Places at rest and at the edges, most where the curve or the marks moved it before.
    expect(places).toBeGreaterThan(500)
    expect(atEdge).toBeGreaterThan(50)
    expect(movedBefore / places).toBeGreaterThan(0.5)
  })

  it("leaves the axes to the tick numbers: R2's lit P and Q hide none (2026-10-08)", () => {
    const scene = buildPlaneScene({ ...BASE, qX: -1.5, pLit: true })
    // P (2, 4) and Q (−1.5, 2.25) drop their lines to both axes, and that is all they put there.
    expect(layoutMarks(scene, vp, opts).dropLines.map(({ ink, x2, y2 }) => ({ ink, x2, y2 }))).toEqual([
      { ink: "chartPoint1", x2: 568, y2: 396 },
      { ink: "chartPoint1", x2: 468, y2: 196 },
      { ink: "chartPoint2", x2: 393, y2: 396 },
      { ink: "chartPoint2", x2: 468, y2: 283.5 },
    ])
    const { ticks } = draw(scene)
    // Their tags hid −2 and −1 (Q) and 2 (P) on the x-axis, 2 (Q) and 4 (P) on the y-axis.
    expect(ticks("x")).toEqual(expect.arrayContaining(["−2", "−1", "2"]))
    expect(ticks("y")).toEqual(expect.arrayContaining(["2", "4"]))
  })

  it("tags no axis for P or Q at rest, lit (hovered, focused or dragged) or with Q hovering (2026-10-08)", () => {
    let scenes = 0
    let lines = 0
    for (const fn of BASE_FUNCTION_SLUGS) {
      for (const params of [DEFAULT_PARAMS, R3]) {
        for (let x = -9; x <= 9; x += 0.25) {
          for (const pLit of [false, true]) {
            // Q away, or just right of P.
            for (const qX of [null, x + 0.1]) {
              const marks = layoutMarks(buildPlaneScene({ ...BASE, fn, params, pX: x, qX, pLit }), vp, opts)
              // Labels and edge markers carry their coordinates; nothing sits on the axes.
              expect(marks.annotations).toEqual([])
              lines += marks.dropLines.length
              scenes++
            }
          }
        }
      }
    }
    expect(scenes).toBeGreaterThan(2000)
    // Lit P's and Q's drop lines stay.
    expect(lines).toBeGreaterThan(2000)
  })

  it("holds Q's up-right of Q the same way, over P's label where they meet", () => {
    let places = 0
    let atEdge = 0
    let overP = 0
    let movedBefore = 0
    for (const fn of BASE_FUNCTION_SLUGS) {
      for (const params of [DEFAULT_PARAMS, R3]) {
        for (const pX of [-2, 0.5, 2]) {
          // The pointer across the plane; P lit from the keyboard, or k's annotation out.
          for (let qX = -9; qX <= 9; qX += 0.25) {
            const scene = buildPlaneScene({
              ...BASE,
              fn,
              params,
              pX,
              qX,
              pLit: pX === 0.5,
              active: pX === 2 ? "k" : null,
            })
            const [p, q] = layoutMarks(scene, vp, opts).points
            if (q?.marker == null || q.label === null) {
              continue
            }
            places++
            if (held(q.marker, q.label.box)) {
              atEdge++
            }
            if (p?.label != null && intersects(p.label.box, q.label.box)) {
              overP++
            }
            if (
              elsewhere(layoutMarks(placedClear(scene, "q"), vp, opts).points[1]?.label?.box, q.label.box)
            ) {
              movedBefore++
            }
          }
        }
      }
    }
    // Places at rest and at the edges, many over P's label, most where the curve or the marks moved it before.
    expect(places).toBeGreaterThan(800)
    expect(atEdge).toBeGreaterThan(100)
    expect(overP).toBeGreaterThan(100)
    expect(movedBefore / places).toBeGreaterThan(0.5)
  })
})

describe("no a, b, h or k on the plane (the user's ruling, 2026-10-08)", () => {
  const ACTIVE = [null, "a", "b", "h", "k", "anchor", "stretch"] as const

  it("prints only tick numbers, the O and P's and Q's labels, whatever value is active", () => {
    let drawn = 0
    for (const fn of BASE_FUNCTION_SLUGS) {
      for (const params of [DEFAULT_PARAMS, R3]) {
        for (const active of ACTIVE) {
          // A handle lit and held while it is the active one; P and Q in view.
          const handle = active === "anchor" || active === "stretch" ? active : null
          const scene = buildPlaneScene({
            ...BASE,
            fn,
            params,
            active,
            pX: -1,
            qX: 0.25,
            pLit: true,
            handleLit: handle,
            handleHeld: handle,
          })
          expect(scene.annotations).toHaveLength(active === null ? 0 : 1)
          const { texts, ticks } = draw(scene)
          const ticksDrawn = new Set([...ticks("x"), ...ticks("y")])
          const others = texts.filter((t) => !ticksDrawn.has(t) && !/^[OPQ]$/.test(t) && !/^\(.*\)$/.test(t))
          expect(others).toEqual([])
          expect(texts).toEqual(expect.arrayContaining(["P", "Q"]))
          drawn++
        }
      }
    }
    expect(drawn).toBe(BASE_FUNCTION_SLUGS.length * 2 * ACTIVE.length)
  })

  it("leaves the tick numbers where a dragged anchor's h and k tags were", () => {
    // The anchor dragged to (2, 1): its tags hid the x-axis's 2 and the y-axis's 1.
    const params = { a: 1, b: 1, h: 2, k: 1 }
    const scene = buildPlaneScene({
      ...BASE,
      params,
      active: "anchor",
      handleLit: "anchor",
      handleHeld: "anchor",
    })
    const { texts, ticks } = draw(scene)
    expect(ticks("x")).toContain("2")
    expect(ticks("y")).toContain("1")
    expect(texts.filter((t) => t === "2")).toHaveLength(2)
    expect(texts.filter((t) => t === "1")).toHaveLength(2)
  })
})
