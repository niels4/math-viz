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
  active: null,
  handleLit: null,
  handleHeld: null,
  pWas: null,
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
    expect(ghost).toMatchObject({ ink: "foregroundMuted", width: 2, dash: [6, 6], alpha: 0.75, back: true })
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

  it("draws k from y = 0 to y = k at x = h, its plate beside it, under the curve (R5)", () => {
    const [k] = buildPlaneScene({ ...BASE, params: R3, active: "k" }).annotations ?? []
    expect(k).toEqual({
      layer: "under",
      ink: "primary",
      onInk: "primaryForeground",
      lines: [{ from: { x: -1, y: 0 }, to: { x: -1, y: 1 }, width: 2.5, startTick: 9, arrow: true }],
      plates: [
        {
          runs: [{ text: "k", italic: true }, { text: "= 1" }],
          size: "md",
          place: { kind: "beside", at: { x: -1, y: 0.5 } },
        },
      ],
    })
  })

  it("draws h from x = 0 to x = h at y = k, its plate 16 px above (FV 02 › H3)", () => {
    const [h] = buildPlaneScene({ ...BASE, params: R3, active: "h" }).annotations ?? []
    expect(h?.lines).toEqual([
      { from: { x: 0, y: 1 }, to: { x: -1, y: 1 }, width: 2.5, startTick: 9, arrow: true },
    ])
    expect(h?.plates[0]?.runs).toEqual([{ text: "h", italic: true }, { text: "= −1" }])
    expect(h?.plates[0]?.place).toEqual({ kind: "above", at: { x: -0.5, y: 1 }, gap: 16 })
  })

  it("draws a and b as the unit box's sides from the anchor to the unit point (R7, FV 04)", () => {
    const [a] = buildPlaneScene({ ...BASE, params: R3, active: "a" }).annotations ?? []
    // Four dashed sides at 80 %, then a's: from (0, 1) up to the unit point (0, 3), with end ticks.
    expect(a?.lines).toHaveLength(5)
    expect(a?.lines.slice(0, 4).every((l) => l.dash !== undefined && l.alpha === 0.8)).toBe(true)
    expect(a?.lines[4]).toEqual({ from: { x: 0, y: 1 }, to: { x: 0, y: 3 }, width: 3, endTicks: 7 })
    expect(a?.plates[0]?.place).toEqual({ kind: "beside", at: { x: 0, y: 2 } })
    const [b] = buildPlaneScene({ ...BASE, params: R3, active: "b" }).annotations ?? []
    expect(b?.lines[4]).toEqual({ from: { x: -1, y: 1 }, to: { x: 0, y: 1 }, width: 3, endTicks: 7 })
    expect(b?.plates[0]?.runs).toEqual([{ text: "b", italic: true }, { text: "= 1" }])
  })

  it("drops a dragged anchor's h and k onto the axes, over the curve (R6)", () => {
    const params = { a: 2, b: 1, h: 1.5, k: 1 }
    const [anchor] = buildPlaneScene({ ...BASE, params, active: "anchor" }).annotations ?? []
    expect(anchor?.layer).toBe("over")
    expect(anchor?.lines).toEqual([
      { from: { x: 1.5, y: 1 }, to: { x: 1.5, y: 0 }, width: 1.5, dash: [5, 4] },
      { from: { x: 1.5, y: 1 }, to: { x: 0, y: 1 }, width: 1.5, dash: [5, 4] },
    ])
    expect(anchor?.plates.map((p) => [p.size, p.place])).toEqual([
      ["sm", { kind: "x-axis", x: 1.5, clear: { x: 1.5, y: 1 } }],
      ["sm", { kind: "y-axis", y: 1, clear: { x: 1.5, y: 1 } }],
    ])
  })

  it("draws a dragged stretch grip's unit box with both sides and their tags (FV 11 › G3)", () => {
    const params = { a: 2, b: 1.5, h: -1, k: 1 }
    const [box] = buildPlaneScene({ ...BASE, params, active: "stretch" }).annotations ?? []
    expect(box?.layer).toBe("over")
    expect(box?.lines.slice(4)).toEqual([
      { from: { x: -1, y: 1 }, to: { x: 0.5, y: 1 }, width: 3 },
      { from: { x: 0.5, y: 1 }, to: { x: 0.5, y: 3 }, width: 3 },
    ])
    expect(box?.plates.map((p) => p.runs[0]?.text)).toEqual(["b", "a"])
  })

  it("marks where a transform's drag found P, with an arrow in --primary (R5)", () => {
    const [p] = buildPlaneScene({ ...BASE, params: R3, pX: 0.5, pWas: 4.5 }).points
    expect(p?.was).toEqual({ x: 0.5, y: 4.5, ink: "primary" })
  })
})
