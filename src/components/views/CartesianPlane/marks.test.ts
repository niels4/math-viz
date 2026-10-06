import { describe, expect, it } from "vitest"

import type { CanvasFace } from "./faces.ts"
import type { PlanePoint, PlaneScene } from "./scene.ts"

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
  it("lays out R2: P's label, Q's probe, its tags and label at the snapshot's boxes", () => {
    const marks = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    const [p, q] = marks.points
    expect(boxOf(p?.label)).toEqual({ x: 590, y: 141.8, w: 108, h: 41 })
    expect(boxOf(q?.label)).toEqual({ x: 199, y: 296.7, w: 172, h: 41 })
    expect(marks.tags.map(boxOf)).toEqual([
      { x: 364.5, y: 382, w: 57, h: 28 },
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

  it("prints coordinates by the number rule: x at 2 dp, y short, U+2212 minus", () => {
    const marks = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    const texts = (plate: { runs: readonly { kind: string; text?: string }[] } | null | undefined) =>
      plate?.runs.map((r) => r.text ?? `<${r.kind}>`)
    expect(texts(marks.points[0]?.label)).toEqual(["P", "(2, 4)"])
    expect(texts(marks.points[1]?.label)).toEqual(["Q", "(−1.5, 2.25)"])
    expect(marks.tags.map(texts)).toEqual([["−1.5"], ["2.25"]])
  })

  it("skips the tick labels under a tag: the tags, 4 px larger", () => {
    const marks = layout(scene(x2, [P(2, 4), Q(-1.5, 2.25)], -1.5))
    expect(marks.tickKeepOut).toEqual([
      { x: 360.5, y: 378, w: 65, h: 36 },
      { x: 435.5, y: 265.5, w: 65, h: 36 },
    ])
  })

  it("lays out R3 and R4: P's label clears the curve, Q's label goes up-left", () => {
    const r3Marks = layout(scene(r3, [P(0.5, 5.5)]), 597)
    expect(boxOf(r3Marks.points[0]?.label)).toEqual({ x: 515, y: 66.8, w: 149, h: 41 })
    const r4 = layout(scene(r3, [P(0.5, 5.5), Q(-2, 3)], -2), 597)
    expect(boxOf(r4.points[1]?.label)).toEqual({ x: 225, y: 191.8, w: 121, h: 41 })
    expect(r4.tags.map(boxOf)).toEqual([
      { x: 348.5, y: 382, w: 39, h: 28 },
      { x: 453, y: 232, w: 30, h: 28 },
    ])
  })

  it("lights a focused point and drops its coordinates like Q's (FV 04 › Y1)", () => {
    const marks = layout(scene(x2, [P(2, 4, { focus: true, axisTags: true })]))
    expect(marks.points[0]?.marker?.focus).toBe(true)
    expect(marks.tags.map(boxOf)).toEqual([
      { x: 553, y: 382, w: 30, h: 28 },
      { x: 453, y: 182, w: 30, h: 28 },
    ])
    expect(marks.dropLines.map((l) => l.ink)).toEqual(["chartPoint1", "chartPoint1"])
  })

  it("marks a point off the view on its edge, with its letter and coordinates (FV 10 X1)", () => {
    // x³ at P = 2 is 8, above y = 7.92.
    const marks = layout(scene((x) => x ** 3, [P(2, 8)]))
    const [p] = marks.points
    expect(p?.marker).toBeNull()
    expect(p?.label).toBeNull()
    expect(p?.edge?.runs.map((r) => (r.kind === "text" ? r.text : r.dir))).toEqual(["up", "P", "(2, 8)"])
    // "▲ P (2, 8)": runs of 12, 11 and 55 px, 8 apart, inside 2 + 8 and 12 + 2:
    // 118 wide, centred on P's x at the top.
    expect(boxOf(p?.edge)).toEqual({ x: 509, y: 22, w: 118, h: 39 })
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
})
