import { useAtomValue } from "jotai"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { visibleRangeAtom } from "../../../CartesianPlane/state.ts"
import { baseFunctions } from "../../baseFunctions.ts"
import { aParam, bParam, funcParam, hParam, kParam } from "../../queryParams.ts"
import { qXAtom } from "../../state.ts"
import { transformed } from "../../transformCurves.ts"
import { readoutSlots } from "./format.ts"
import { PointMark } from "./PointMark.tsx"
import { PointReadout } from "./PointReadout.tsx"
import style from "./PRow.module.css"

export const QRow = () => {
  const [func] = useQueryParam(funcParam)
  const [a] = useQueryParam(aParam)
  const [b] = useQueryParam(bParam)
  const [h] = useQueryParam(hParam)
  const [k] = useQueryParam(kParam)
  const x = useAtomValue(qXAtom)
  const range = useAtomValue(visibleRangeAtom)
  const y = x === null ? null : transformed(baseFunctions[func], { a, b, h, k })(x)

  return (
    <div className={style.point}>
      <div className={style.head}>
        <PointMark shape="ring" />
        <var className={style.letter}>Q</var>
        <span className={style.role_slot}>
          <span className={style.role}>{x === null ? "point at the plane" : "follows your pointer"}</span>
        </span>
        <PointReadout x={x} y={y} slots={readoutSlots(range)} />
      </div>
    </div>
  )
}
