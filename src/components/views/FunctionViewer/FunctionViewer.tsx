import type { ChangeEvent } from "react"

import { useState } from "react"

import type { PlotFunc } from "../CartesianPlane/types"

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
  x2: "x^2",
  x3: "x^3",
  sin: "sin(x)",
} as const

const isPlotFuncSlug = (slug: string): slug is PlotFuncSlug => {
  return (plotFuncSlugs as readonly string[]).includes(slug)
}

export function FunctionViewer() {
  const [funcSlug, setFuncSlug] = useState<PlotFuncSlug>(defaultFuncSlug)

  const onSelectFunc = (e: ChangeEvent<HTMLSelectElement>) => {
    if (isPlotFuncSlug(e.target.value)) {
      setFuncSlug(e.target.value)
    }
  }

  return (
    <div>
      <CartesianPlane {...{ plotFunc: plotFuncs[funcSlug] }} />
      <label className={style.sidebar} htmlFor="plot-func-select">
        Function:
        <select id="plot-func-select" value={funcSlug} onChange={onSelectFunc}>
          {plotFuncSlugs.map((slug) => (
            <option key={slug} value={slug}>
              {plotFuncLabels[slug]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
