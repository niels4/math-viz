import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { funcParam, type FunctionSlug } from "../queryParams"
import style from "./SideBar.module.css"

const functionLabels: Record<FunctionSlug, string> = {
  x1: "x",
  x2: "x²",
  x3: "x³",
  sinx: "sin x",
}

const FunctionSelector = () => {
  const [func, setFunc] = useQueryParam(funcParam)

  return (
    <fieldset className={style.function_selector}>
      <legend className={style.function_title}>Function</legend>

      <div className={style.function_buttons}>
        {Object.entries(functionLabels).map(([slug, label]) => (
          <label key={slug} className={style.function_input}>
            <input
              type="radio"
              name="func"
              value={slug}
              checked={slug === func}
              onChange={() => setFunc(slug as FunctionSlug, { flush: true })}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export const SideBar = () => {
  return (
    <div className={style.sidebar}>
      <FunctionSelector />
    </div>
  )
}
