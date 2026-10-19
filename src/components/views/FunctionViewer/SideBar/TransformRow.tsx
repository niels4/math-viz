import { useQueryParam, type QueryParamDef } from "#src/components/router/queryParamAtom.ts"

import style from "./TransformRow.module.css"

// One transform parameter: its name, and its value in a box. The box only
// shows the value for now.
export const TransformRow = ({ name, param }: { name: string; param: QueryParamDef<number> }) => {
  const [value] = useQueryParam(param)

  return (
    <label className={style.row}>
      <span className={style.name}>{name}</span>
      <input type="text" className={style.box} value={value.toFixed(2)} readOnly />
    </label>
  )
}
