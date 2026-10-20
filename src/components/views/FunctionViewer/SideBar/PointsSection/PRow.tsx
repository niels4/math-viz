import { useAtomValue } from "jotai"
import { useRef, useState } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { ArrowKey, Key, Tip } from "#src/components/ui/Tip.tsx"

import { visibleRangeAtom } from "../../../CartesianPlane/state.ts"
import { baseFunctions } from "../../baseFunctions.ts"
import { aParam, bParam, funcParam, hParam, kParam, pParam } from "../../queryParams.ts"
import { transformed } from "../../transformCurves.ts"
import { formatNumber, readoutSlots } from "./format.ts"
import { PointMark } from "./PointMark.tsx"
import { PointReadout } from "./PointReadout.tsx"
import { PointSlider, type PointSliderHandle } from "./PointSlider.tsx"
import style from "./PRow.module.css"
import { XField, type FieldEdit } from "./XField.tsx"

const roles = { above: "above the view", below: "below the view" } as const

export const PRow = () => {
  const [func] = useQueryParam(funcParam)
  const [a] = useQueryParam(aParam)
  const [b] = useQueryParam(bParam)
  const [h] = useQueryParam(hParam)
  const [k] = useQueryParam(kParam)
  const [x] = useQueryParam(pParam)
  const range = useAtomValue(visibleRangeAtom)
  const y = transformed(baseFunctions[func], { a, b, h, k })(x)
  const off = range === null ? null : y > range.maxY ? "above" : y < range.minY ? "below" : null
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
            <Triangle dir={off === "above" ? "up" : "down"} />
          </span>
        )}
        <span className={style.role_slot}>
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

const Triangle = ({ dir }: { dir: "up" | "down" }) => (
  <svg width="10" height="9" viewBox="0 0 10 9" fill="currentColor" aria-hidden="true">
    <path d={dir === "up" ? "M5 0L10 9H0Z" : "M0 0H10L5 9Z"} />
  </svg>
)
