import type { CSSProperties, ReactNode } from "react"

import { MathText } from "#src/components/ui/MathText.tsx"
import { formatNumber, numberParts, relation } from "#src/util/format/number.ts"

import type { ReadoutSlots } from "./readoutFit.ts"

import style from "./PointReadout.module.css"

/** The placeholder for a number with no point (U+2013, the design's dash). */
const NO_NUMBER = "–"

/** y's whole-px box comes from its slot, in characters of the readout face (PointReadout.module.css). */
const sized = (chars: number): CSSProperties => ({ "--chars": chars }) as CSSProperties

// A point's readout (point-readout-fv › Readout · f(x) = y) on one
// baseline: "f(", ")" and the relation in STIX 24, the numbers in the
// readout face at 500 22 (Roboto Mono; STIX in sage-editorial), each at 2
// decimals. The user's ruling: the decimal points hold still while the
// point slides through the view. The readout keeps the width of its slots;
// y sits right-aligned in its own (a blank where a minus would go), and "f("
// with x right-aligned in x's, so x's spare room goes before "f(" and x's
// right edge holds still too. = when y
// prints exactly, ≈ when it prints rounded; a y beyond fixed digits prints
// scientific with a raised exponent (FV 10). With no point (null) both
// numbers are dashes and the readout is muted, so the card keeps its size.
// `xField` takes x's place when x can be typed (P).
export function PointReadout({
  x,
  y,
  xField,
  slots = null,
  testId,
}: {
  x: number | null
  y: number | null
  xField?: ReactNode
  /** The slots the plane's visible range asks for (readoutFit.ts); null keeps each number's own width. */
  slots?: ReadoutSlots | null
  testId?: string
}) {
  const xText = x === null ? NO_NUMBER : formatNumber(x)
  const parts = y === null ? null : numberParts(y)
  const yText = parts?.kind === "fixed" ? parts.text : NO_NUMBER
  // A dash keeps its own width: an empty readout isn't sliding.
  const xChars = x === null ? xText.length : Math.max(xText.length, slots?.x ?? 0)
  const yChars = y === null ? yText.length : Math.max(yText.length, slots?.y ?? 0)
  return (
    <span
      className={style.readout}
      data-empty={y === null || undefined}
      // An empty readout's dashes say nothing aloud; the card's note does.
      aria-hidden={y === null || undefined}
      data-testid={testId}
    >
      <span className={style.lead} style={{ "--slot": xChars } as CSSProperties}>
        <span className={`${style.math} ${style.open}`}>
          <MathText text="f(" />
        </span>
        <span className={`${style.number} ${style.x}`}>{xField ?? xText}</span>
      </span>
      <span className={`${style.math} ${style.close}`}>)</span>
      <span className={`${style.math} ${style.rel}`}> {y === null ? "=" : relation(y)} </span>
      {parts?.kind === "sci" ? (
        <span className={style.number}>
          {parts.mantissa}×10<span className={style.exponent}>{parts.exponent}</span>
        </span>
      ) : (
        <span className={style.number} style={sized(yChars)}>
          {yText}
        </span>
      )}
    </span>
  )
}
