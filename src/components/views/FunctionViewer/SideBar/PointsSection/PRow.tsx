import { useAtomValue } from "jotai"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { visibleRangeAtom } from "../../../CartesianPlane/state.ts"
import { baseFunctions } from "../../baseFunctions.ts"
import { aParam, bParam, funcParam, hParam, kParam, pParam } from "../../queryParams.ts"
import { transformed } from "../../transformCurves.ts"
import { readoutSlots } from "./format.ts"
import { PointMark } from "./PointMark.tsx"
import { PointReadout } from "./PointReadout.tsx"
import { PointSlider } from "./PointSlider.tsx"
import style from "./PRow.module.css"

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
        <PointReadout x={x} y={y} slots={readoutSlots(range)} />
      </div>
      <PointSlider />
    </div>
  )
}

const Triangle = ({ dir }: { dir: "up" | "down" }) => (
  <svg width="10" height="9" viewBox="0 0 10 9" fill="currentColor" aria-hidden="true">
    <path d={dir === "up" ? "M5 0L10 9H0Z" : "M0 0H10L5 9Z"} />
  </svg>
)
