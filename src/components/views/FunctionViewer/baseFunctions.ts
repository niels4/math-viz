import type { PlotFunction } from "../CartesianPlane/drawCartesianPlane"
import type { FunctionSlug } from "./queryParams"

export const baseFunctions: Record<FunctionSlug, PlotFunction> = {
  x1: (x) => x,
  x2: (x) => x * x,
  x3: (x) => x * x * x,
  sinx: Math.sin,
}
