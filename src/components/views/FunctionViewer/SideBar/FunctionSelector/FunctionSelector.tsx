import type { ReactNode } from "react"

import cn from "classnames"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { funcParam } from "../../queryParams"
import { type FunctionSlug } from "../../queryParams"
import sidebarStyle from "../SideBar.module.css"
import { FunctionReadout } from "./FunctionReadout"
import style from "./FunctionSelector.module.css"

const functionLabels: Record<FunctionSlug, ReactNode> = {
  x1: <var>x</var>,
  x2: (
    <>
      <var>x</var>²
    </>
  ),
  x3: (
    <>
      <var>x</var>³
    </>
  ),
  sinx: (
    <>
      sin <var>x</var>
    </>
  ),
}

export const FunctionSelector = () => {
  const [func, setFunc] = useQueryParam(funcParam)

  return (
    <div className={cn(sidebarStyle.card, style.card)}>
      <fieldset className={style.function_selector}>
        <legend className={sidebarStyle.card_title}>Function</legend>

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
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <FunctionReadout />
    </div>
  )
}
