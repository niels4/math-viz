import type { PlotFunction } from "../CartesianPlane/drawCartesianPlane"
import type { FunctionSlug } from "./queryParams"

export const baseFunctions: Record<FunctionSlug, PlotFunction> = {
  x1: (x) => x,
  x2: (x) => x * x,
  x3: (x) => x * x * x,
  sinx: Math.sin,
}

export const unitX: Record<FunctionSlug, number> = {
  x1: 1,
  x2: 1,
  x3: 1,
  sinx: Math.PI / 2,
}
