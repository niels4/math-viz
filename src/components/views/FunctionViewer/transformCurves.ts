import type { PlotCurve, PlotFunction, PlotLine, PlotPoint } from "../CartesianPlane/drawCartesianPlane"
import type { TransformParam } from "./state"

export type Transform = Record<TransformParam, number>

const isIdentity = ({ a, b, h, k }: Transform) => a === 1 && b === 1 && h === 0 && k === 0

export const transformed =
  (g: PlotFunction, { a, b, h, k }: Transform): PlotFunction =>
  (x) =>
    a * g((x - h) / b) + k

export const transformCurves = (curves: readonly PlotCurve[], transform: Transform): PlotCurve[] =>
  curves.flatMap((curve) => [
    ...(isIdentity(transform) ? [] : [{ ...curve, dashed: true }]),
    { ...curve, fn: transformed(curve.fn, transform) },
  ])

export const unitPoint = (g: PlotFunction, u: number, { a, b, h, k }: Transform): PlotPoint => ({
  x: h + b * u,
  y: a * g(u) + k,
})

const dashedBox = (from: PlotPoint, to: PlotPoint): PlotLine[] => {
  const corners = [from, { x: to.x, y: from.y }, to, { x: from.x, y: to.y }]
  return corners.map((corner, i) => ({
    from: corner,
    to: corners[(i + 1) % corners.length] ?? from,
    look: "dashed",
  }))
}

export const transformLines = (
  lit: readonly TransformParam[],
  g: PlotFunction,
  u: number,
  transform: Transform,
): PlotLine[] => {
  const shift = { x: transform.h, y: transform.k }
  const unit = unitPoint(g, u, transform)
  const corner = { x: unit.x, y: shift.y }
  const box = lit.includes("a") || lit.includes("b") ? dashedBox(shift, unit) : []
  return [
    ...box,
    ...lit.map((param): PlotLine => {
      switch (param) {
        case "k":
          return { from: { x: shift.x, y: 0 }, to: shift, look: "arrow" }
        case "h":
          return { from: { x: 0, y: shift.y }, to: shift, look: "arrow" }
        case "a":
          return { from: corner, to: unit, look: "measured" }
        case "b":
          return { from: shift, to: corner, look: "measured" }
      }
    }),
  ]
}
