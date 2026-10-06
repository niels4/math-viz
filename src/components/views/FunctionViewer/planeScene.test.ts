import { describe, expect, it } from "vitest"

import type { PlaneSceneInput } from "./planeScene.ts"

import { DEFAULT_PARAMS } from "./math/form.ts"
import { buildPlaneScene } from "./planeScene.ts"

const BASE: PlaneSceneInput = {
  fn: "x2",
  params: DEFAULT_PARAMS,
  pX: 2,
  qX: null,
  ghostOn: true,
  pLit: false,
}
const R3 = { a: 2, b: 1, h: -1, k: 1 }

describe("buildPlaneScene", () => {
  it("draws R1/R2's defaults: the curve, P named and draggable, no ghost (D7: no transform)", () => {
    const scene = buildPlaneScene(BASE)
    expect(scene.curves.map((c) => c.id)).toEqual(["f"])
    expect(scene.curves[0]).toMatchObject({ ink: "chartLine", width: 3.5, glow: true, avoid: true })
    expect(scene.points).toEqual([
      {
        id: "p",
        x: 2,
        y: 4,
        style: "bullseye",
        ink: "chartPoint1",
        name: "P",
        focus: false,
        axisTags: false,
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
    expect(ghost).toMatchObject({ ink: "foregroundMuted", width: 2, dash: [6, 6], alpha: 0.75 })
    expect(ghost?.avoid).toBeUndefined()
    // The untransformed g: x², vertex at the origin; f is R3's.
    expect(ghost?.fn(2)).toBe(4)
    expect(f?.fn(0.5)).toBe(5.5)
    expect(buildPlaneScene({ ...BASE, params: R3, ghostOn: false }).curves.map((c) => c.id)).toEqual(["f"])
  })

  it("follows the pointer with Q: its guide, drop lines and tags, painted after P (R2, R4)", () => {
    const scene = buildPlaneScene({ ...BASE, qX: -1.5 })
    expect(scene.points.map((p) => p.id)).toEqual(["p", "q"])
    expect(scene.points[1]).toMatchObject({
      x: -1.5,
      y: 2.25,
      style: "ring",
      ink: "chartPoint2",
      name: "Q",
      axisTags: true,
      edgeMarker: true,
    })
    expect(scene.points[1]?.draggable).toBeUndefined()
    expect(scene.guides).toEqual([{ kind: "pointer-x", x: -1.5 }])
  })

  it("lights P with its halo and its coordinates on the axes (FV 04 › Y1)", () => {
    expect(buildPlaneScene({ ...BASE, pLit: true }).points[0]).toMatchObject({ focus: true, axisTags: true })
  })
})
