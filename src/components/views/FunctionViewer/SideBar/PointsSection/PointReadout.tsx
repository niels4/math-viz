import type { CSSProperties } from "react"

import { formatNumber, relation, type ReadoutSlots } from "./format"
import style from "./PointReadout.module.css"

export const PointReadout = ({ x, y, slots }: { x: number; y: number; slots: ReadoutSlots | null }) => {
  const xText = formatNumber(x)
  const yText = formatNumber(y)
  const xChars = Math.max(xText.length, slots?.x ?? 0)
  const yChars = Math.max(yText.length, slots?.y ?? 0)

  return (
    <span className={style.readout}>
      <span className={style.lead} style={{ "--chars": xChars } as CSSProperties}>
        <span className={`${style.math} ${style.open}`}>
          <var>f</var>(
        </span>
        <span className={style.number}>{xText}</span>
      </span>
      <span className={`${style.math} ${style.close}`}>)</span>
      <span className={`${style.math} ${style.rel}`}> {relation(y)} </span>
      <span className={style.number} style={{ "--chars": yChars } as CSSProperties}>
        {yText}
      </span>
    </span>
  )
}
