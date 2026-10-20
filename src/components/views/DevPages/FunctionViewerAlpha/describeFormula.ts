import type { PlotFunc } from "./CartesianPlane/types.ts"
import type { FormulaKind } from "./FunctionFormula.tsx"

// Display numbers cap at 3 decimal places with trailing zeros stripped:
// 1 -> "1", 2.5 -> "2.5", 0.30000000000000004 -> "0.3".
export const fmt = (n: number): string => String(Number(n.toFixed(3)))

// Mathematical minus (U+2212), not the hyphen-minus on keyboards.
export const MINUS = "−"

export const isBareInput = (p: PlotFunc): boolean => p.xScale === 1 && p.xOffset === 0

// Plain-text mirror of the typeset formula for aria-labels and tests:
// f(x) = 3((x/2) − 1)² + 1. Fractions stay slash-form here; the visual
// component stacks them.
export function describeFormula(slug: FormulaKind, p: PlotFunc): string {
  const bare = isBareInput(p)
  const scaled = p.xScale === 1 ? "x" : `x/${fmt(p.xScale)}`
  let inner: string
  if (bare) {
    inner = "x"
  } else if (p.xOffset === 0) {
    inner = scaled
  } else {
    inner = `${scaled} ${p.xOffset > 0 ? MINUS : "+"} ${fmt(Math.abs(p.xOffset))}`
  }
  let base: string
  switch (slug) {
    case "x":
      base = inner
      break
    case "x2":
      base = bare ? "x²" : `(${inner})²`
      break
    case "x3":
      base = bare ? "x³" : `(${inner})³`
      break
    case "sin":
      base = `sin(${inner})`
      break
  }
  const showCoeff = p.yScale !== 1
  const coeff = showCoeff
    ? `${p.yScale < 0 ? MINUS : ""}${Math.abs(p.yScale) === 1 ? "" : fmt(Math.abs(p.yScale))}${slug === "sin" ? " " : ""}`
    : ""
  const based = slug === "x" && coeff !== "" && !bare ? `(${base})` : base
  const expr = `${coeff}${based}`
  const out = p.yOffset === 0 ? expr : `${expr} ${p.yOffset > 0 ? "+" : MINUS} ${fmt(Math.abs(p.yOffset))}`
  return `f(x) = ${out}`
}
