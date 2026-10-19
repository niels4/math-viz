import type {
  PlotCurve,
  PlotFunction,
  PlotHandle,
  PlotLine,
  PlotPoint,
} from "../CartesianPlane/drawCartesianPlane"
import type { TransformParam } from "./state"

export type Transform = Record<TransformParam, number>

const isIdentity = ({ a, b, h, k }: Transform) => a === 1 && b === 1 && h === 0 && k === 0

const transformed =
  (g: PlotFunction, { a, b, h, k }: Transform): PlotFunction =>
  (x) =>
    a * g((x - h) / b) + k

export const transformCurves = (curves: readonly PlotCurve[], transform: Transform): PlotCurve[] =>
  curves.flatMap((curve) => [
    ...(isIdentity(transform) ? [] : [{ ...curve, dashed: true }]),
    { ...curve, fn: transformed(curve.fn, transform) },
  ])

const unitPoint = (g: PlotFunction, u: number, { a, b, h, k }: Transform): PlotPoint => ({
  x: h + b * u,
  y: a * g(u) + k,
})

export const transformHandles = (g: PlotFunction, u: number, transform: Transform): PlotHandle[] => [
  { x: transform.h, y: transform.k, shape: "diamond" },
  { ...unitPoint(g, u, transform), shape: "square" },
]

const dashedBox = (from: PlotPoint, to: PlotPoint): PlotLine[] => {
  const corners = [from, { x: to.x, y: from.y }, to, { x: from.x, y: to.y }]
  return corners.map((corner, i) => ({
    from: corner,
    to: corners[(i + 1) % corners.length] ?? from,
    look: "dashed",
  }))
}

export const transformLines = (
  lit: TransformParam | null,
  g: PlotFunction,
  u: number,
  transform: Transform,
): PlotLine[] => {
  const shift = { x: transform.h, y: transform.k }
  const unit = unitPoint(g, u, transform)
  const corner = { x: unit.x, y: shift.y }
  switch (lit) {
    case "k":
      return [{ from: { x: shift.x, y: 0 }, to: shift, look: "arrow" }]
    case "h":
      return [{ from: { x: 0, y: shift.y }, to: shift, look: "arrow" }]
    case "a":
      return [...dashedBox(shift, unit), { from: corner, to: unit, look: "measured" }]
    case "b":
      return [...dashedBox(shift, unit), { from: shift, to: corner, look: "measured" }]
    case null:
      return []
  }
}
