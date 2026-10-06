import { describe, expect, it } from "vitest"

import type { CanvasFace } from "./faces.ts"

import { EDGE_LETTER_FACE, LABEL_LETTER_FACE, readoutFaces } from "./faces.ts"
import { EDGE_STYLE, LABEL_STYLE, layoutPlate, outlined, TAG_STYLE } from "./plates.ts"

const measure = (face: CanvasFace, text: string): number =>
  face.font.includes("italic") ? 0.57 * face.size * text.length : 0.6001 * face.size * text.length
const readout = readoutFaces(`"Roboto Mono", monospace`)

// The Components board's instances (fv-rec-components.json): each run's box
// left edge, and where Figma's AUTO box puts the baseline.
describe("layoutPlate", () => {
  it("builds point-label-fv: P at 14, its coordinates at 32, 108 × 41 for P (2, 4)", () => {
    const plate = layoutPlate(
      [
        { kind: "text", text: "P", face: LABEL_LETTER_FACE, ink: "foreground" },
        { kind: "text", text: "(2, 4)", face: readout.label, ink: "foreground" },
      ],
      LABEL_STYLE,
      outlined("chartPoint1"),
      measure,
    )
    expect(plate.box).toEqual({ x: 0, y: 0, w: 108, h: 41 })
    expect(plate.radius).toBe(20.5)
    // Letter box at y 8 (25 tall), coordinates at y 9.5 (22 tall): baselines below each box's top.
    expect(plate.runs.map((r) => r.x)).toEqual([14, 32])
    expect(plate.runs[0]?.y).toBeCloseTo(8 + 20 * (0.125 + 0.762), 9)
    expect(plate.runs[1]?.y).toBeCloseTo(9.5 + 17 * (2146 / 2048), 9)
  })

  it("builds edge-marker-fv: arrow box at (10, 13.5), letter at 30, coordinates at 49", () => {
    const plate = layoutPlate(
      [
        { kind: "triangle", dir: "up", ink: "chartPoint1" },
        { kind: "text", text: "P", face: EDGE_LETTER_FACE, ink: "foreground" },
        { kind: "text", text: "(−3, 10.56)", face: readout.small, ink: "foregroundMuted" },
      ],
      EDGE_STYLE,
      outlined("chartPoint1"),
      measure,
    )
    expect(plate.box).toEqual({ x: 0, y: 0, w: 163, h: 39 })
    expect(plate.runs.map((r) => [r.x, r.kind === "triangle" ? r.y : "text"])).toEqual([
      [10, 13.5],
      [30, "text"],
      [49, "text"],
    ])
  })

  it("builds axis-tag-fv: 57 × 28 for −1.5, radius 6, the value at 10", () => {
    const plate = layoutPlate(
      [{ kind: "text", text: "−1.5", face: readout.small, ink: "foreground" }],
      TAG_STYLE,
      outlined("chartPoint2"),
      measure,
    )
    expect(plate.box).toEqual({ x: 0, y: 0, w: 57, h: 28 })
    expect(plate.radius).toBe(6)
    expect(plate.runs[0]?.x).toBe(10)
  })
})
