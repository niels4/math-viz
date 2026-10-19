import type { PlotCurve, PlotFunction } from "../CartesianPlane/drawCartesianPlane"
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
