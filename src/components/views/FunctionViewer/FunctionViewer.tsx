import { useId, useState } from "react"

import type { PlotFunc } from "../CartesianPlane/types"

import { Field } from "../../ui/Field"
import { SnowflakeIcon } from "../../ui/icons.tsx"
import { Select } from "../../ui/Select"
import { SettingsMenu } from "../../ui/SettingsMenu.tsx"
import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import style from "./FunctionViewer.module.css"

const plotFuncSlugs = ["x", "x2", "x3", "sin"] as const

const defaultFuncSlug = plotFuncSlugs[1]

type PlotFuncSlug = (typeof plotFuncSlugs)[number]

const plotFuncs: Record<PlotFuncSlug, PlotFunc> = {
  x: (x) => x,
  x2: (x) => x ** 2,
  x3: (x) => x ** 3,
  sin: (x) => Math.sin(x),
} as const

const plotFuncLabels: Record<PlotFuncSlug, string> = {
  x: "x",
  x2: "x²",
  x3: "x³",
  sin: "sin(x)",
} as const

const funcOptions = plotFuncSlugs.map((slug) => ({ value: slug, label: `f(x) = ${plotFuncLabels[slug]}` }))

const isPlotFuncSlug = (slug: string): slug is PlotFuncSlug => {
  return (plotFuncSlugs as readonly string[]).includes(slug)
}

export function FunctionViewer() {
  const [funcSlug, setFuncSlug] = useState<PlotFuncSlug>(defaultFuncSlug)
  const id = useId()
  const selectId = `func-select-${id}`

  const onSelectFunc = (next: string) => {
    if (isPlotFuncSlug(next)) {
      setFuncSlug(next)
    }
  }

  return (
    <div className={style.page}>
      <CartesianPlane {...{ plotFunc: plotFuncs[funcSlug] }} />
      <div className={style.overlay}>
        <header className={style.topbar}>
          <a className={style.brand} href="#">
            <span className={style.brand_icon}>
              <SnowflakeIcon />
            </span>
            <span className={style.brand_text}>MathViz</span>
          </a>
          <h1 className={style.title}>Function Viewer</h1>
          <div className={style.actions}>
            <SettingsMenu />
          </div>
        </header>
        <div className={style.sidebar}>
          <Field className={style.func_select_label} label="Function" htmlFor={selectId}>
            <Select
              id={selectId}
              testId={selectId}
              value={funcSlug}
              onChange={onSelectFunc}
              options={funcOptions}
              className={style.func_select}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}
