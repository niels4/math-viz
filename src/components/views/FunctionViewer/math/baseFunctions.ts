// The base functions g the viewer transforms. Each carries its unit point
// (decision D14): the curve's own point u with g(u) = 1, where the unit box
// and the stretch handle sit, so a scale reads off the curve itself.

export const BASE_FUNCTION_SLUGS = ["x", "x2", "x3", "sin"] as const

export type BaseFunctionSlug = (typeof BASE_FUNCTION_SLUGS)[number]

export type BaseFunction = {
  g: (u: number) => number
  /** Maths as the picker and the Original toggle print it ("y = x²"). */
  label: string
  /** D14: 1 for the powers, π/2 for sin, so g(unitX) = 1. */
  unitX: number
}

export const BASE_FUNCTIONS: Readonly<Record<BaseFunctionSlug, BaseFunction>> = {
  x: { g: (u) => u, label: "x", unitX: 1 },
  x2: { g: (u) => u * u, label: "x²", unitX: 1 },
  x3: { g: (u) => u * u * u, label: "x³", unitX: 1 },
  sin: { g: Math.sin, label: "sin x", unitX: Math.PI / 2 },
}

export const isBaseFunctionSlug = (slug: string): slug is BaseFunctionSlug =>
  (BASE_FUNCTION_SLUGS as readonly string[]).includes(slug)
