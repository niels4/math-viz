import { describe, expect, it } from "vitest"

import type { CanvasFace } from "./faces.ts"
import type { DrawnPlane } from "./region.ts"
import type { PlanePoint, PlaneScene } from "./scene.ts"

import { lineBox, readoutFaces, TICK_LABEL_FACE } from "./faces.ts"
import { layoutGrid } from "./grid.ts"
import { layoutMarks } from "./marks.ts"
import { curveBox, regionOf } from "./region.ts"
import { makeViewport } from "./viewport.ts"

// As in marks.test.ts: advances as Figma shaped the boards' text.
const measure = (face: CanvasFace, text: string): number =>
  face.font.includes("italic")
    ? text.split("").reduce((w, ch) => w + (ch === "Q" ? 0.72 : 0.57) * face.size, 0)
    : text.length * 0.6001 * face.size

const VP = makeViewport({ width: 936, height: 792, dpr: 1 }, { zoom: 50, panX: 0, panY: 0 })

const P = (x: number, y: number): PlanePoint => ({
  id: "p",
  x,
  y,
  style: "bullseye",
  ink: "chartPoint1",
  name: "P",
  edgeMarker: true,
})

const x2 = (x: number) => x * x

const drawn = (scene: PlaneScene): DrawnPlane => {
  const marks = layoutMarks(scene, VP, { measure, readout: readoutFaces("mono"), plates: [], corners: [] })
  const grid = layoutGrid(VP, { labelWidth: (text) => text.length * 8.4, originWidth: 11 })
  return { vp: VP, scene, marks, labels: grid.labels }
}

const R1: PlaneScene = {
  curves: [{ id: "f", fn: x2, ink: "chartLine", width: 3.5 }],
  points: [P(2, 4)],
  guides: [],
}

const r2 = (v: number) => Math.round(v * 100) / 100
const round = (r: { x: number; y: number; w: number; h: number } | null) =>
  r === null ? null : { x: r2(r.x), y: r2(r.y), right: r2(r.x + r.w), bottom: r2(r.y + r.h) }

describe("curveBox", () => {
  it("covers a curve's visible part with its stroke: x² below the top edge at 50 px per unit", () => {
    // y ≤ 7.92 for |x| ≤ 2.81: samples at px 328 … 608, the vertex at 396.
    expect(round(curveBox(VP, { id: "f", fn: x2, ink: "chartLine", width: 3.5 }))).toEqual({
      x: 326.25,
      y: 2.25,
      right: 609.75,
      bottom: 397.75,
    })
  })

  it("is null for a curve wholly off the view", () => {
    expect(curveBox(VP, { id: "f", fn: (x) => x * x + 20, ink: "chartLine", width: 3.5 })).toBeNull()
  })
})

describe("regionOf", () => {
  it("spans R1's curve, P with its label, and the x labels under them (the tour's first hole)", () => {
    const region = regionOf(drawn(R1), ["f", "p"])
    // P's label sits at R2's box (590, 141.8), 108 wide; the x labels −2 … 4
    // (centres 368 … 668) hang 9 px under the x-axis at 396.
    expect(round(region)).toEqual({
      x: 326.25,
      y: 2.25,
      right: 698,
      bottom: r2(405 + lineBox(TICK_LABEL_FACE)),
    })
  })

  it("leaves out what isn't named, and the labels of an axis that doesn't cross the parts", () => {
    const pOnly = regionOf(drawn(R1), ["p"])
    // P's marker (568, 196) ± 12 and its label; the x-axis at 396 lies below them.
    expect(round(pOnly)).toEqual({ x: 556, y: 141.8, right: 698, bottom: 208 })
  })

  it("takes a point's edge marker while it is off the view", () => {
    const scene: PlaneScene = { ...R1, points: [P(2, 40)] }
    const d = drawn(scene)
    const edge = d.marks.points[0]?.edge
    expect(edge).not.toBeNull()
    expect(regionOf(d, ["p"])).toEqual(edge?.box)
  })

  it("is null for names that draw nothing", () => {
    expect(regionOf(drawn(R1), ["q"])).toBeNull()
  })
})
