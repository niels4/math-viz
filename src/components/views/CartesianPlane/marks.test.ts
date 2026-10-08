import { describe, expect, it } from "vitest"

import type { CanvasFace } from "./faces.ts"
import type { PlaneAnnotation, PlaneHandle, PlanePoint, PlaneScene } from "./scene.ts"

import { readoutFaces } from "./faces.ts"
import { layoutMarks, NO_MARKS } from "./marks.ts"
import { intersects } from "./rect.ts"
import { makeViewport } from "./viewport.ts"

// Advances as Figma shaped the boards' text: Roboto Mono 0.6 em, STIX
// italic P and Q 0.57 and 0.72 em. Figma rounds each text box up to whole px.
const measure = (face: CanvasFace, text: string): number =>
  face.font.includes("italic")
    ? text.split("").reduce((w, ch) => w + (ch === "Q" ? 0.72 : 0.57) * face.size, 0)
    : text.length * 0.6001 * face.size

const readout = readoutFaces(`"Roboto Mono", monospace`)

// The chrome as the boards place it on a 936 × 792 plane: the caption plate,
// the scale strip, the tools (R2: the zoom control; R3, R4: with the Original
// toggle), the four corner brackets.
const plates = (toolsX: number) => [
  { x: 28, y: 22, w: 186, h: 35 },
  { x: 28, y: 735, w: 112, h: 35 },
  { x: toolsX, y: 734, w: 908 - toolsX, h: 36 },
]
const corners = [10, 898].flatMap((x) => [10, 754].map((y) => ({ x, y, w: 28, h: 28 })))

const R2_VP = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, panX: 0, panY: 0 })

const P = (x: number, y: number, extra: Partial<PlanePoint> = {}): PlanePoint => ({
  id: "p",
  x,
  y,
  style: "bullseye",
  ink: "chartPoint1",
  name: "P",
  edgeMarker: true,
  draggable: true,
  ...extra,
})
const Q = (x: number, y: number, extra: Partial<PlanePoint> = {}): PlanePoint => ({
  id: "q",
  x,
  y,
  style: "ring",
  ink: "chartPoint2",
  name: "Q",
  dropLines: true,
  edgeMarker: true,
  ...extra,
})

const scene = (f: (x: number) => number, points: PlanePoint[], guideX?: number): PlaneScene => ({
  curves: [{ id: "f", fn: f, ink: "chartLine", width: 3.5, avoid: true }],
  points,
  guides: guideX === undefined ? [] : [{ kind: "pointer-x", x: guideX }],
})

const x2 = (x: number) => x * x
const r3 = (x: number) => 2 * (x + 1) ** 2 + 1

const layout = (s: PlaneScene, toolsX = 769) =>
  layoutMarks(s, R2_VP, { measure, readout, plates: plates(toolsX), corners })

const boxOf = (plate: { box: { x: number; y: number; w: number; h: number } } | null | undefined) =>
  plate === null || plate === undefined
    ? null
    : {
        x: Math.round(plate.box.x * 10) / 10,
        y: Math.round(plate.box.y * 10) / 10,
        w: plate.box.w,
        h: plate.box.h,
      }

describe("layoutMarks", () => {
  // The snapshot's places; the boxes are as wide as fixed decimals make
  // them (the user's ruling): "(2.00, 4.00)" where the board prints "(2, 4)".
  // A label left of its point keeps the board's right edge.
  it("lays out R2: P's label, Q's probe, its drop lines and label at the snapshot's places", () => {
    const marks = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    const [p, q] = marks.points
    expect(boxOf(p?.label)).toEqual({ x: 590, y: 141.8, w: 169, h: 41 })
    expect(boxOf(q?.label)).toEqual({ x: 189, y: 296.7, w: 182, h: 41 })
    expect(marks.guides).toEqual([{ x: 393 }])
    // Drop lines from Q to both axes, in Q's ink.
    expect(marks.dropLines).toEqual([
      { ink: "chartPoint2", x1: 393, y1: 283.5, x2: 393, y2: 396 },
      { ink: "chartPoint2", x1: 393, y1: 283.5, x2: 468, y2: 283.5 },
    ])
    expect(p?.marker).toEqual({ x: 568, y: 196, style: "bullseye", ink: "chartPoint1", focus: false })
  })

  it("prints coordinates by the number rule: 2 decimals, U+2212 minus", () => {
    const marks = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    const texts = (plate: { runs: readonly { kind: string; text?: string }[] } | null | undefined) =>
      plate?.runs.map((r) => r.text ?? `<${r.kind}>`)
    expect(texts(marks.points[0]?.label)).toEqual(["P", "(2.00, 4.00)"])
    expect(texts(marks.points[1]?.label)).toEqual(["Q", "(−1.50, 2.25)"])
  })

  it("lays out R3 and R4: P's label clears the curve, Q's label goes up-left", () => {
    const r3Marks = layout(scene(r3, [P(0.5, 5.5)]), 597)
    expect(boxOf(r3Marks.points[0]?.label)).toEqual({ x: 515, y: 66.8, w: 169, h: 41 })
    const r4 = layout(scene(r3, [P(0.5, 5.5), Q(-2, 3)], -2), 597)
    expect(boxOf(r4.points[1]?.label)).toEqual({ x: 164, y: 191.8, w: 182, h: 41 })
  })

  it("lights a focused point and drops lines from it like Q's (FV 04 › Y1)", () => {
    const marks = layout(scene(x2, [P(2, 4, { focus: true, dropLines: true })]))
    expect(marks.points[0]?.marker?.focus).toBe(true)
    expect(marks.dropLines).toEqual([
      { ink: "chartPoint1", x1: 568, y1: 196, x2: 568, y2: 396 },
      { ink: "chartPoint1", x1: 568, y1: 196, x2: 468, y2: 196 },
    ])
  })

  it("marks a point off the view on its edge, with its letter and coordinates (FV 10 X1)", () => {
    // x³ at P = 2 is 8, above y = 7.92.
    const marks = layout(scene((x) => x ** 3, [P(2, 8)]))
    const [p] = marks.points
    expect(p?.marker).toBeNull()
    expect(p?.label).toBeNull()
    expect(p?.edge?.runs.map((r) => (r.kind === "text" ? r.text : r.dir))).toEqual([
      "up",
      "P",
      "(2.00, 8.00)",
    ])
    // "▲ P (2.00, 8.00)": runs of 12, 11 and 109 px, 8 apart, inside 2 + 8 and
    // 12 + 2: 172 wide, centred on P's x at the top.
    expect(boxOf(p?.edge)).toEqual({ x: 482, y: 22, w: 172, h: 39 })
    expect(marks.hits).toContainEqual({ kind: "edge", id: "p", box: p?.edge?.box, target: { x: 2, y: 8 } })
  })

  it("drops only to the axis an off-view point still crosses", () => {
    const marks = layout(scene((x) => x ** 3, [Q(1.8, 5.832), Q(2.5, 15.625)], 1.8))
    // The second Q is above the view: only a line from the top edge to the x-axis.
    expect(marks.dropLines).toHaveLength(3)
    expect(marks.dropLines.at(-1)).toEqual({ ink: "chartPoint2", x1: 593, y1: 0, x2: 593, y2: 396 })
  })

  it("gives a draggable point in view its 48 px hit box", () => {
    const marks = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    expect(marks.hits).toEqual([{ kind: "point", id: "p", box: { x: 544, y: 172, w: 48, h: 48 } }])
  })

  it("lays out nothing before the plane has a size", () => {
    const vp = makeViewport({ width: 0, height: 0, dpr: 1 }, { zoom: 50, panX: 0, panY: 0 })
    expect(layoutMarks(scene(x2, [P(2, 4)]), vp, { measure, readout, plates: [], corners: [] })).toBe(
      NO_MARKS,
    )
  })

  it("gives each handle its 44 px hit box, under the points, and keeps plates off its box", () => {
    const marks = layout({ ...scene(r3, [P(0.5, 5.5)]), handles: R3_HANDLES })
    expect(marks.hits).toEqual([
      { kind: "point", id: "p", box: { x: 469, y: 97, w: 48, h: 48 } },
      { kind: "handle", id: "stretch", box: { x: 446, y: 224, w: 44, h: 44 } },
      { kind: "handle", id: "anchor", box: { x: 396, y: 324, w: 44, h: 44 } },
    ])
    expect(marks.handles).toEqual([
      { x: 418, y: 346, shape: "diamond", ink: "primary", halo: false, held: false },
      { x: 468, y: 246, shape: "square", ink: "primary", halo: false, held: false },
    ])
  })
})

const R3_HANDLES: PlaneHandle[] = [
  { id: "anchor", x: -1, y: 1, shape: "diamond", ink: "primary" },
  { id: "stretch", x: 0, y: 3, shape: "square", ink: "primary" },
]

const ghost = {
  id: "original",
  fn: x2,
  ink: "foregroundMuted" as const,
  width: 2,
  dash: [6, 6],
  alpha: 0.75,
  back: true,
}

describe("layoutMarks › annotations, handles, where a point was", () => {
  it("lays out R5: k's dimension line, P's ghost and arrow", () => {
    const k: PlaneAnnotation = {
      layer: "under",
      ink: "primary",
      lines: [{ from: { x: -1, y: 0 }, to: { x: -1, y: 1 }, width: 2.5, startTick: 9, arrow: true }],
    }
    const marks = layout(
      {
        curves: [ghost, { id: "f", fn: r3, ink: "chartLine", width: 3.5, avoid: true }],
        points: [P(0.5, 5.5, { was: { x: 0.5, y: 4.5, ink: "primary" } })],
        guides: [],
        handles: R3_HANDLES,
        annotations: [k],
      },
      597,
    )
    const [annotation] = marks.annotations
    expect(annotation?.strokes).toEqual([
      { x1: 418, y1: 396, x2: 418, y2: 346, width: 2.5, startTick: 9, arrow: true },
    ])
    // "P before": Ø22 at (493, 171); "P moved" from 158 to the head's tip at 135.
    const was = marks.points[0]?.was
    expect(was).toEqual({
      x: 493,
      y: 171,
      ink: "chartPoint1",
      arrow: { x1: 493, y1: 158, x2: 493, y2: 135, ink: "primary" },
    })
    expect(boxOf(marks.points[0]?.label)).toEqual({ x: 515, y: 66.8, w: 169, h: 41 })
  })

  it("lays out R6: the anchor's drop lines over the curve, its halo, P's label clear of the curve", () => {
    const r6 = (x: number) => 2 * (x - 1.5) ** 2 + 1
    const anchor: PlaneAnnotation = {
      layer: "over",
      ink: "primary",
      lines: [
        { from: { x: 1.5, y: 1 }, to: { x: 1.5, y: 0 }, width: 1.5, dash: [5, 4] },
        { from: { x: 1.5, y: 1 }, to: { x: 0, y: 1 }, width: 1.5, dash: [5, 4] },
      ],
    }
    const marks = layout(
      {
        curves: [ghost, { id: "f", fn: r6, ink: "chartLine", width: 3.5, avoid: true }],
        points: [P(0.5, 3)],
        guides: [],
        handles: [
          { id: "anchor", x: 1.5, y: 1, shape: "diamond", ink: "primary", halo: true, held: true },
          { id: "stretch", x: 2.5, y: 3, shape: "square", ink: "primary" },
        ],
        annotations: [anchor],
      },
      597,
    )
    // From the anchor (543, 346) down to the x-axis and across to the y-axis.
    expect(marks.annotations[0]?.strokes.map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 }))).toEqual([
      { x1: 543, y1: 346, x2: 543, y2: 396 },
      { x1: 543, y1: 346, x2: 468, y2: 346 },
    ])
    expect(marks.handles[0]).toMatchObject({ halo: true, held: true })
    expect(boxOf(marks.points[0]?.label)).toEqual({ x: 302, y: 191.8, w: 169, h: 41 })
  })

  it("holds a fixed label (P's) up-right of its point whatever crowds it; Q's keeps clear of it", () => {
    // R6, where fvPlace takes P's label left-up (302, 191.8): here P is lit
    // (its drop lines out), Q's marker sits in the label's spot, and the
    // anchor's drop line is out.
    const r6 = (x: number) => 2 * (x - 1.5) ** 2 + 1
    const marks = layout(
      {
        curves: [ghost, { id: "f", fn: r6, ink: "chartLine", width: 3.5, avoid: true }],
        points: [P(0.5, 3, { labelPlace: "fixed", focus: true, dropLines: true }), Q(1.5, 3.6)],
        guides: [{ kind: "pointer-x", x: 1.5 }],
        handles: [
          { id: "anchor", x: 1.5, y: 1, shape: "diamond", ink: "primary", halo: true, held: true },
          { id: "stretch", x: 2.5, y: 3, shape: "square", ink: "primary" },
        ],
        annotations: [
          {
            layer: "over",
            ink: "primary",
            lines: [{ from: { x: 1.5, y: 1 }, to: { x: 1.5, y: 0 }, width: 1.5, dash: [5, 4] }],
          },
        ],
      },
      597,
    )
    const [p, q] = marks.points
    expect(boxOf(p?.label)).toEqual({ x: 515, y: 191.8, w: 169, h: 41 })
    const pBox = p?.label?.box
    const qBox = q?.label?.box
    expect(pBox !== undefined && qBox !== undefined && intersects(pBox, qBox)).toBe(false)
  })

  it("holds a fixed label over the labels before it (Q's over P's)", () => {
    // R6's P and Q, both held: Q (1.5, 3.6) at (543, 216) keeps its label
    // 22 px right of it and 13.2 px above it, across P's.
    const r6 = (x: number) => 2 * (x - 1.5) ** 2 + 1
    const marks = layout(
      {
        curves: [ghost, { id: "f", fn: r6, ink: "chartLine", width: 3.5, avoid: true }],
        points: [P(0.5, 3, { labelPlace: "fixed" }), Q(1.5, 3.6, { labelPlace: "fixed" })],
        guides: [{ kind: "pointer-x", x: 1.5 }],
      },
      597,
    )
    const [p, q] = marks.points
    expect(boxOf(p?.label)).toEqual({ x: 515, y: 191.8, w: 169, h: 41 })
    expect(boxOf(q?.label)).toMatchObject({ x: 565, y: 161.8, h: 41 })
    const pBox = p?.label?.box
    const qBox = q?.label?.box
    expect(pBox !== undefined && qBox !== undefined && intersects(pBox, qBox)).toBe(true)
  })

  it("draws no arrow from where a point was when the two nearly touch", () => {
    const marks = layout(scene(x2, [P(2, 4, { was: { x: 2, y: 3.6, ink: "primary" } })]), 597)
    expect(marks.points[0]?.was?.arrow).toBeNull()
  })

  it("marks where a point was only in view, and its arrow only with the point in view too", () => {
    // Was above the view: nothing to mark (a full-height arrow would read as a stray line).
    const above = layout(scene(x2, [P(2, 4, { was: { x: 2, y: 13.5, ink: "primary" } })]), 597)
    expect(above.points[0]?.was).toBeNull()
    // Now below the view: the ring stays, the edge marker says where the point went.
    const below = layout(scene(x2, [P(2, -9, { was: { x: 2, y: 4, ink: "primary" } })]), 597)
    expect(below.points[0]?.was).toMatchObject({ x: 568, y: 196, arrow: null })
  })
})

describe("layoutMarks mid-motion (FV 05)", () => {
  it("fades and moves a point's parts at paint time, its boxes resting", () => {
    const rest = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    const moving = layout({
      ...scene(x2, [
        P(2, 4, { alpha: 0.5, labelAlpha: 0.5, labelRise: 8 }),
        { ...Q(-1.5, 2.25), alpha: 0.4, reach: 0.5 },
      ]),
      guides: [{ kind: "pointer-x", x: -1.5, alpha: 0.4 }],
    })
    const [p, q] = moving.points
    expect(p?.marker?.alpha).toBe(0.5)
    expect(p?.label?.motion).toEqual({ alpha: 0.25, dx: 0, dy: 8 })
    expect(boxOf(p?.label)).toEqual(boxOf(rest.points[0]?.label))
    expect(q?.label?.motion).toEqual({ alpha: 0.4, dx: 0, dy: 0 })
    expect(moving.guides).toEqual([{ x: 393, alpha: 0.4 }])
    // Q's drop lines reach half way to the axes.
    expect(moving.dropLines).toEqual([
      { ink: "chartPoint2", x1: 393, y1: 283.5, x2: 393, y2: 339.75, alpha: 0.4 },
      { ink: "chartPoint2", x1: 393, y1: 283.5, x2: 430.5, y2: 283.5, alpha: 0.4 },
    ])
    expect(moving.hits).toEqual(rest.hits)
  })

  it("leaves a point at rest as it was", () => {
    const marks = layout(scene(x2, [P(2, 4, { alpha: 1, labelAlpha: 1, labelRise: 0 })]))
    expect(marks.points[0]?.marker).toEqual({
      x: 568,
      y: 196,
      style: "bullseye",
      ink: "chartPoint1",
      focus: false,
    })
    expect(marks.points[0]?.label?.motion).toBeUndefined()
  })

  it("fades handles and names the edge an off-view point lies past", () => {
    const marks = layout({
      ...scene(x2, [P(2, 9, { alpha: 0.5 })]),
      handles: [{ id: "anchor", x: 0, y: 0, shape: "diamond", ink: "primary", alpha: 0.3 }],
    })
    expect(marks.handles[0]?.alpha).toBe(0.3)
    expect(marks.points[0]?.edgeDir).toBe("up")
    expect(marks.points[0]?.edge?.motion).toEqual({ alpha: 0.5, dx: 0, dy: 0 })
  })
})
