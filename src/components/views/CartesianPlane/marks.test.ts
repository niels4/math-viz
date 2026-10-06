import { describe, expect, it } from "vitest"

import type { CanvasFace } from "./faces.ts"
import type { PlaneAnnotation, PlaneHandle, PlanePoint, PlaneScene } from "./scene.ts"

import { readoutFaces } from "./faces.ts"
import { layoutMarks, NO_MARKS } from "./marks.ts"
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
const Q = (x: number, y: number): PlanePoint => ({
  id: "q",
  x,
  y,
  style: "ring",
  ink: "chartPoint2",
  name: "Q",
  axisTags: true,
  edgeMarker: true,
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
  it("lays out R2: P's label, Q's probe, its tags and label at the snapshot's places", () => {
    const marks = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    const [p, q] = marks.points
    expect(boxOf(p?.label)).toEqual({ x: 590, y: 141.8, w: 169, h: 41 })
    expect(boxOf(q?.label)).toEqual({ x: 189, y: 296.7, w: 182, h: 41 })
    expect(marks.tags.map(boxOf)).toEqual([
      { x: 360, y: 382, w: 66, h: 28 },
      { x: 439.5, y: 269.5, w: 57, h: 28 },
    ])
    expect(marks.guides).toEqual([393])
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
    expect(marks.tags.map(texts)).toEqual([["−1.50"], ["2.25"]])
  })

  it("skips the tick labels under a tag: the tags, 4 px larger", () => {
    const marks = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    expect(marks.tickKeepOut).toEqual([
      { x: 356, y: 378, w: 74, h: 36 },
      { x: 435.5, y: 265.5, w: 65, h: 36 },
    ])
  })

  it("lays out R3 and R4: P's label clears the curve, Q's label goes up-left", () => {
    const r3Marks = layout(scene(r3, [P(0.5, 5.5)]), 597)
    expect(boxOf(r3Marks.points[0]?.label)).toEqual({ x: 515, y: 66.8, w: 169, h: 41 })
    const r4 = layout(scene(r3, [P(0.5, 5.5), Q(-2, 3)], -2), 597)
    expect(boxOf(r4.points[1]?.label)).toEqual({ x: 164, y: 191.8, w: 182, h: 41 })
    expect(r4.tags.map(boxOf)).toEqual([
      { x: 335, y: 382, w: 66, h: 28 },
      { x: 439.5, y: 232, w: 57, h: 28 },
    ])
  })

  it("lights a focused point and drops its coordinates like Q's (FV 04 › Y1)", () => {
    const marks = layout(scene(x2, [P(2, 4, { focus: true, axisTags: true })]))
    expect(marks.points[0]?.marker?.focus).toBe(true)
    expect(marks.tags.map(boxOf)).toEqual([
      { x: 539.5, y: 382, w: 57, h: 28 },
      { x: 439.5, y: 182, w: 57, h: 28 },
    ])
    expect(marks.dropLines.map((l) => l.ink)).toEqual(["chartPoint1", "chartPoint1"])
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
    // The second Q is above the view: a line from the top edge to the x-axis, one tag.
    expect(marks.dropLines.at(-1)).toEqual({ ink: "chartPoint2", x1: 593, y1: 0, x2: 593, y2: 396 })
    expect(marks.tags).toHaveLength(3)
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

// The plates' maths in STIX Two Text, at the vendored fonts' advances
// (fonttools, per 1000 em): Figma rounds each text box up to whole px.
const STIX_UPRIGHT: Readonly<Record<string, number>> = { "=": 720, " ": 235, ".": 245, "−": 720, ",": 245 }
const STIX_ITALIC: Readonly<Record<string, number>> = { a: 534, b: 495, h: 549, k: 499, P: 569, Q: 707 }
const stixMeasure = (face: CanvasFace, text: string): number =>
  face.font.includes("STIX")
    ? text
        .split("")
        .reduce(
          (w, ch) =>
            w +
            ((face.font.includes("italic")
              ? STIX_ITALIC[ch]
              : (STIX_UPRIGHT[ch] ?? (/\d/.test(ch) ? 495 : 0))) ?? 0) *
              (face.size / 1000),
          0,
        )
    : text.length * 0.6001 * face.size

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

const note = (letter: string, value: string) => [{ text: letter, italic: true }, { text: `= ${value}` }]

const stixLayout = (s: PlaneScene, plane = R2_VP, chrome = { plates: plates(597), corners }) =>
  layoutMarks(s, plane, { measure: stixMeasure, readout, ...chrome })

describe("layoutMarks › annotations, handles, where a point was", () => {
  it("lays out R5: k's dimension line, its plate clear of both curves, P's ghost and arrow", () => {
    const k: PlaneAnnotation = {
      layer: "under",
      ink: "primary",
      onInk: "primaryForeground",
      lines: [{ from: { x: -1, y: 0 }, to: { x: -1, y: 1 }, width: 2.5, startTick: 9, arrow: true }],
      plates: [{ runs: note("k", "1"), size: "md", place: { kind: "beside", at: { x: -1, y: 0.5 } } }],
    }
    const marks = stixLayout({
      curves: [ghost, { id: "f", fn: r3, ink: "chartLine", width: 3.5, avoid: true }],
      points: [P(0.5, 5.5, { was: { x: 0.5, y: 4.5, ink: "primary" } })],
      guides: [],
      handles: R3_HANDLES,
      annotations: [k],
    })
    const [annotation] = marks.annotations
    expect(annotation?.strokes.map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 }))).toEqual([
      { x1: 418, y1: 396, x2: 418, y2: 346 },
    ])
    // The snapshot's "k label": 62 × 30 at (346, 377), left-down of the line's middle.
    expect(annotation?.plates.map(boxOf)).toEqual([{ x: 346, y: 377, w: 62, h: 30 }])
    expect(annotation?.plates[0]?.fill).toBe("primary")
    expect(annotation?.plates[0]?.border).toBeNull()
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

  it("lays out R6: the anchor's drop lines, h under the x-axis, k left of the y-axis", () => {
    const r6 = (x: number) => 2 * (x - 1.5) ** 2 + 1
    const anchor: PlaneAnnotation = {
      layer: "over",
      ink: "primary",
      onInk: "primaryForeground",
      lines: [
        { from: { x: 1.5, y: 1 }, to: { x: 1.5, y: 0 }, width: 1.5, dash: [5, 4] },
        { from: { x: 1.5, y: 1 }, to: { x: 0, y: 1 }, width: 1.5, dash: [5, 4] },
      ],
      plates: [
        { runs: note("h", "1.5"), size: "sm", place: { kind: "x-axis", x: 1.5, clear: { x: 1.5, y: 1 } } },
        { runs: note("k", "1"), size: "sm", place: { kind: "y-axis", y: 1, clear: { x: 1.5, y: 1 } } },
      ],
    }
    const marks = stixLayout({
      curves: [ghost, { id: "f", fn: r6, ink: "chartLine", width: 3.5, avoid: true }],
      points: [P(0.5, 3)],
      guides: [],
      handles: [
        { id: "anchor", x: 1.5, y: 1, shape: "diamond", ink: "primary", halo: true, held: true },
        { id: "stretch", x: 2.5, y: 3, shape: "square", ink: "primary" },
      ],
      annotations: [anchor],
    })
    expect(marks.annotations[0]?.plates.map(boxOf)).toEqual([
      { x: 509, y: 412, w: 68, h: 25 },
      { x: 406, y: 333.5, w: 54, h: 25 },
    ])
    // The tags carry their numbers: the tick labels under them are skipped.
    expect(marks.tickKeepOut).toEqual([
      { x: 505, y: 408, w: 76, h: 33 },
      { x: 402, y: 329.5, w: 62, h: 33 },
    ])
    expect(marks.handles[0]).toMatchObject({ halo: true, held: true })
    expect(boxOf(marks.points[0]?.label)).toEqual({ x: 302, y: 191.8, w: 169, h: 41 })
  })

  it("lays out R7: a's unit box and its plate on the third ring, clear of the ghost", () => {
    const box: PlaneAnnotation = {
      layer: "under",
      ink: "primary",
      onInk: "primaryForeground",
      lines: [{ from: { x: 0, y: 1 }, to: { x: 0, y: 3 }, width: 3, endTicks: 7 }],
      plates: [{ runs: note("a", "2"), size: "md", place: { kind: "beside", at: { x: 0, y: 2 } } }],
    }
    const marks = stixLayout({
      curves: [ghost, { id: "f", fn: r3, ink: "chartLine", width: 3.5, avoid: true }],
      points: [P(0.5, 5.5)],
      guides: [],
      handles: R3_HANDLES,
      annotations: [box],
    })
    expect(marks.annotations[0]?.plates.map(boxOf)).toEqual([{ x: 538, y: 338, w: 63, h: 30 }])
  })

  it("moves a drag's tag to the axis's far side rather than cover the handle's halo", () => {
    // Components › anchor dragged: the anchor at (−1, 1) hugs the y-axis.
    const marks = stixLayout({
      curves: [
        { id: "f", fn: (x) => 2 * ((x + 1) / 1.5) ** 2 + 1, ink: "chartLine", width: 3.5, avoid: true },
      ],
      points: [],
      guides: [],
      annotations: [
        {
          layer: "over",
          ink: "primary",
          onInk: "primaryForeground",
          lines: [],
          plates: [
            { runs: note("h", "−1"), size: "sm", place: { kind: "x-axis", x: -1, clear: { x: -1, y: 1 } } },
            { runs: note("k", "1"), size: "sm", place: { kind: "y-axis", y: 1, clear: { x: -1, y: 1 } } },
          ],
        },
      ],
    })
    const [h, k] = marks.annotations[0]?.plates ?? []
    // h stays under the axis, as on the board; k leaves the halo (396–440) for the right side.
    expect(boxOf(h)).toMatchObject({ y: 412 })
    expect(boxOf(k)).toMatchObject({ x: 476 })
  })

  it("draws no arrow from where a point was when the two nearly touch", () => {
    const marks = stixLayout(scene(x2, [P(2, 4, { was: { x: 2, y: 3.6, ink: "primary" } })]))
    expect(marks.points[0]?.was?.arrow).toBeNull()
  })

  it("marks where a point was only in view, and its arrow only with the point in view too", () => {
    // Was above the view: nothing to mark (a full-height arrow would read as a stray line).
    const above = stixLayout(scene(x2, [P(2, 4, { was: { x: 2, y: 13.5, ink: "primary" } })]))
    expect(above.points[0]?.was).toBeNull()
    // Now below the view: the ring stays, the edge marker says where the point went.
    const below = stixLayout(scene(x2, [P(2, -9, { was: { x: 2, y: 4, ink: "primary" } })]))
    expect(below.points[0]?.was).toMatchObject({ x: 568, y: 196, arrow: null })
  })
})
