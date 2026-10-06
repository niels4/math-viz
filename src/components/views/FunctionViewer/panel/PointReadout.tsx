import type { CSSProperties, ReactNode } from "react"

import { MathText } from "#src/components/ui/MathText.tsx"
import { formatNumber, numberParts, relation } from "#src/util/format/number.ts"

import style from "./PointReadout.module.css"

/** The placeholder for a number with no point (U+2013, the design's dash). */
const NO_NUMBER = "–"

/** A number run's whole-px box comes from its length (PointReadout.module.css). */
const sized = (text: string): CSSProperties => ({ "--chars": text.length }) as CSSProperties

// A point's readout (point-readout-fv › Readout · f(x) = y) on one
// baseline: "f(", ")" and the relation in STIX 24, the numbers in the
// readout face at 500 22 (Roboto Mono; STIX in sage-editorial). = when y
// prints exactly, ≈ when it prints rounded; a y beyond fixed digits prints
// scientific with a raised exponent (FV 10). With no point (null) both
// numbers are dashes and the readout is muted, so the card keeps its size.
// `xField` takes x's place when x can be typed (P).
export function PointReadout({
  x,
  y,
  xField,
  testId,
}: {
  x: number | null
  y: number | null
  xField?: ReactNode
  testId?: string
}) {
  const xText = x === null ? NO_NUMBER : formatNumber(x)
  const parts = y === null ? null : numberParts(y)
  return (
    <span className={style.readout} data-empty={y === null || undefined} data-testid={testId}>
      <span className={`${style.math} ${style.open}`}>
        <MathText text="f(" />
      </span>
      <span className={style.number} style={sized(xText)}>
        {xField ?? xText}
      </span>
      <span className={`${style.math} ${style.close}`}>)</span>
      <span className={`${style.math} ${style.rel}`}> {y === null ? "=" : relation(y)} </span>
      {parts?.kind === "sci" ? (
        <span className={style.number}>
          {parts.mantissa}×10<span className={style.exponent}>{parts.exponent}</span>
        </span>
      ) : (
        <span className={style.number} style={sized(parts?.text ?? NO_NUMBER)}>
          {parts?.text ?? NO_NUMBER}
        </span>
      )}
    </span>
  )
}
