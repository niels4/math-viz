import type { PlotFunction } from "../CartesianPlane/drawCartesianPlane"
import type { FunctionSlug } from "./queryParams"

// The function each option of the sidebar's Function picker graphs.
export const baseFunctions: Record<FunctionSlug, PlotFunction> = {
  x1: (x) => x,
  x2: (x) => x * x,
  x3: (x) => x * x * x,
  sinx: Math.sin,
}
