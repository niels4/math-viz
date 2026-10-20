import { useAtomValue } from "jotai"
import { useRef, useState } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { ArrowKey, Key, Tip } from "#src/components/ui/Tip.tsx"

import { visibleRangeAtom, type VisibleRange } from "../../../CartesianPlane/state.ts"
import { baseFunctions } from "../../baseFunctions.ts"
import { aParam, bParam, funcParam, hParam, kParam, pParam } from "../../queryParams.ts"
import { transformed } from "../../transformCurves.ts"
import { formatChange, formatNumber, readoutSlots } from "./format.ts"
import { PointMark } from "./PointMark.tsx"
import { PointReadout } from "./PointReadout.tsx"
import { PointSlider, type PointSliderHandle } from "./PointSlider.tsx"
import style from "./PRow.module.css"
import { useMovedBy } from "./useMovedBy.ts"
import { XField, type FieldEdit } from "./XField.tsx"

const roles = {
  above: "above the view",
  below: "below the view",
  left: "left of the view",
  right: "right of the view",
} as const

type OffSide = keyof typeof roles

// The side P lies furthest past, as the plane's label points.
const offSide = (x: number, y: number, range: VisibleRange): OffSide | null => {
  const overX = x < range.minX ? range.minX - x : x > range.maxX ? x - range.maxX : 0
  const overY = y < range.minY ? range.minY - y : y > range.maxY ? y - range.maxY : 0
  if (overX === 0 && overY === 0) {
    return null
  }
  return overY >= overX ? (y > range.maxY ? "above" : "below") : x < range.minX ? "left" : "right"
}

const arrows = { above: "up", below: "down", left: "left", right: "right" } as const

export const PRow = () => {
  const [func] = useQueryParam(funcParam)
  const [a] = useQueryParam(aParam)
  const [b] = useQueryParam(bParam)
  const [h] = useQueryParam(hParam)
  const [k] = useQueryParam(kParam)
  const [x] = useQueryParam(pParam)
  const range = useAtomValue(visibleRangeAtom)
  const y = transformed(baseFunctions[func], { a, b, h, k })(x)
  const off = range === null ? null : offSide(x, y, range)
  const moved = useMovedBy(x, y)
  const fieldRef = useRef<HTMLInputElement>(null)
  const sliderRef = useRef<PointSliderHandle>(null)
  const [edit, setEdit] = useState<FieldEdit | null>(null)

  return (
    <div className={style.point}>
      <div className={style.head}>
        <PointMark />
        <var className={style.letter}>P</var>
        {off !== null && (
          <span className={style.off_mark}>
            <Triangle dir={arrows[off]} />
          </span>
        )}
        <span className={style.role_slot}>
          {moved !== null && (
            <span className={style.moved}>
              <span className={style.moved_label}>moved</span>
              <span className={style.moved_value}>{formatChange(moved)}</span>
            </span>
          )}
          <span className={style.role} data-off={off ?? undefined}>
            {off === null ? "pinned" : roles[off]}
          </span>
        </span>
        <PointReadout
          x={x}
          y={y}
          slots={readoutSlots(range)}
          xField={
            <XField
              ref={fieldRef}
              onEditChange={setEdit}
              onEditEnd={(how) => {
                if (how !== "blur") {
                  sliderRef.current?.focus()
                }
              }}
            />
          }
        />
      </div>
      <PointSlider ref={sliderRef} onEditRequest={() => fieldRef.current?.focus()} />
      {edit !== null && (
        <Tip className={style.tip} tone={edit.invalid ? "error" : undefined}>
          {edit.invalid ? (
            <>
              <span>Type a number such as 1.5 ·</span>
              <Key>Esc</Key>
              <span>puts back {formatNumber(edit.base)}</span>
            </>
          ) : (
            <>
              <Key>Enter</Key>
              <span>apply ·</span>
              <ArrowKey dir="up" />
              <ArrowKey dir="down" />
              <span>nudge 0.01</span>
            </>
          )}
        </Tip>
      )}
    </div>
  )
}

const trianglePaths = {
  up: "M5 0L10 9H0Z",
  down: "M0 0H10L5 9Z",
  left: "M9 0V10L0 5Z",
  right: "M0 0L9 5L0 10Z",
} as const

const Triangle = ({ dir }: { dir: keyof typeof trianglePaths }) => {
  const [w, h] = dir === "up" || dir === "down" ? [10, 9] : [9, 10]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="currentColor" aria-hidden="true">
      <path d={trianglePaths[dir]} />
    </svg>
  )
}
