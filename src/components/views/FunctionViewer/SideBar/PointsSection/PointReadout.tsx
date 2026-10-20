import type { CSSProperties, ReactNode } from "react"

import { formatNumber, numberParts, type ReadoutSlots } from "./format"
import style from "./PointReadout.module.css"

export const PointReadout = ({
  x,
  y,
  slots,
  xField,
}: {
  x: number
  y: number
  slots: ReadoutSlots | null
  xField?: ReactNode
}) => {
  const xText = formatNumber(x)
  const yParts = numberParts(y)
  const xChars = Math.max(xText.length, slots?.x ?? 0)

  return (
    <span className={style.readout}>
      <span className={style.lead} style={{ "--chars": xChars } as CSSProperties}>
        <span className={`${style.math} ${style.open}`}>
          <var>f</var>(
        </span>
        <span className={style.number}>{xField ?? xText}</span>
      </span>
      <span className={`${style.math} ${style.close}`}>)</span>
      <span className={`${style.math} ${style.rel}`}> {yParts.exact ? "=" : "≈"} </span>
      {yParts.kind === "sci" ? (
        <span className={style.number}>
          {yParts.mantissa}×10<sup className={style.exponent}>{yParts.exponent}</sup>
        </span>
      ) : (
        <span
          className={style.number}
          style={{ "--chars": Math.max(yParts.text.length, slots?.y ?? 0) } as CSSProperties}
        >
          {yParts.text}
        </span>
      )}
    </span>
  )
}
