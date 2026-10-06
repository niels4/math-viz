import type { ReactNode } from "react"

import type { PlotFunc } from "../CartesianPlane/types.ts"

import { fmt, isBareInput, MINUS } from "./describeFormula.ts"
import style from "./FunctionViewer.module.css"

export type FormulaKind = "x" | "x2" | "x3" | "sin"

type FormulaProps = {
  slug: FormulaKind
  plotFunc: PlotFunc
}

// The transformed input: x, x − 1, or a stacked x-over-scale fraction
// with the offset outside it. Only non-default transforms render.
function InnerX({ p }: { p: PlotFunc }): ReactNode {
  const x = <em className={style.formula_var}>x</em>
  const scaled =
    p.xScale === 1 ? (
      x
    ) : (
      <span className={style.formula_frac}>
        <span className={style.formula_num}>{x}</span>
        <span className={style.formula_den}>{fmt(p.xScale)}</span>
      </span>
    )
  if (p.xOffset === 0) {
    return scaled
  }
  return (
    <>
      {scaled}
      <span className={style.formula_op}>{p.xOffset > 0 ? MINUS : "+"}</span>
      <span>{fmt(Math.abs(p.xOffset))}</span>
    </>
  )
}

// The base shape before the outer yScale/yOffset: x-powers wrap a complex
// input in parentheses, sin sets upright with the input inside.
function BaseFormula({ slug, p }: { slug: FormulaKind; p: PlotFunc }): ReactNode {
  switch (slug) {
    case "x":
      return <InnerX p={p} />
    case "x2":
    case "x3": {
      const exp = slug === "x2" ? "2" : "3"
      if (isBareInput(p)) {
        return (
          <>
            <em className={style.formula_var}>x</em>
            <sup>{exp}</sup>
          </>
        )
      }
      return (
        <>
          <span>(</span>
          <InnerX p={p} />
          <span>)</span>
          <sup>{exp}</sup>
        </>
      )
    }
    case "sin":
      return (
        <>
          <span className={style.formula_sin}>sin</span>
          <span>(</span>
          <InnerX p={p} />
          <span>)</span>
        </>
      )
  }
}

// Full right-hand side: the y-scale becomes a leading coefficient (3(x−1)²,
// never (x−1)² * 3) and a −1 scale is just a leading minus.
function BodyFormula({ slug, p }: { slug: FormulaKind; p: PlotFunc }): ReactNode {
  const showCoeff = p.yScale !== 1
  const showMag = showCoeff && Math.abs(p.yScale) !== 1
  const needsParens = slug === "x" && showCoeff && !isBareInput(p)
  return (
    <>
      {showCoeff && (
        <span className={style.formula_coeff}>
          {p.yScale < 0 ? MINUS : null}
          {showMag ? fmt(Math.abs(p.yScale)) : null}
        </span>
      )}
      {needsParens ? (
        <>
          <span>(</span>
          <BaseFormula slug={slug} p={p} />
          <span>)</span>
        </>
      ) : (
        <BaseFormula slug={slug} p={p} />
      )}
      {p.yOffset !== 0 && (
        <>
          <span className={style.formula_op}>{p.yOffset > 0 ? "+" : MINUS}</span>
          <span>{fmt(Math.abs(p.yOffset))}</span>
        </>
      )}
    </>
  )
}

export function FunctionFormula({ slug, plotFunc }: FormulaProps) {
  return (
    <span className={style.formula} aria-hidden="true">
      <em className={style.formula_fname}>f</em>
      <span>(</span>
      <em className={style.formula_var}>x</em>
      <span>)</span>
      <span className={style.formula_eq}>=</span>
      <BodyFormula slug={slug} p={plotFunc} />
    </span>
  )
}
