import { useState } from "react"

import type { PlotFunc } from "../CartesianPlane/types"

import { Field } from "../../ui/Field"
import { SnowflakeIcon } from "../../ui/icons.tsx"
import { Select } from "../../ui/Select"
import { SettingsMenu } from "../../ui/SettingsMenu.tsx"
import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import style from "./FunctionViewer.module.css"
import { FunctionViewerSidebar } from "./FunctionViewerSidebar.tsx"

const plotFuncSlugs = ["x", "x2", "x3", "sin"] as const

const defaultFuncSlug = plotFuncSlugs[1]

type PlotFuncSlug = (typeof plotFuncSlugs)[number]

const plotFuncs: Record<PlotFuncSlug, (x: number) => number> = {
  x: (x) => x,
  x2: (x) => x ** 2,
  x3: (x) => x ** 3,
  sin: (x) => Math.sin(x),
} as const

// Display numbers cap at 3 decimal places with trailing zeros stripped:
// 1 -> "1", 2.5 -> "2.5", 0.30000000000000004 -> "0.3".
const fmt = (n: number): string => String(Number(n.toFixed(3)))

const plotFuncNames: Record<PlotFuncSlug, string> = {
  x: "x",
  x2: "x²",
  x3: "x³",
  sin: "sin(x)",
}

const plotFuncLabels: Record<PlotFuncSlug, (p: PlotFunc) => string> = {
  x: (p) => `(x / ${fmt(p.xScale)} - ${fmt(p.xOffset)}) * ${fmt(p.yScale)} + ${fmt(p.yOffset)}`,
  x2: (p) => `(x / ${fmt(p.xScale)} - ${fmt(p.xOffset)})² * ${fmt(p.yScale)} + ${fmt(p.yOffset)}`,
  x3: (p) => `(x / ${fmt(p.xScale)} - ${fmt(p.xOffset)})³ * ${fmt(p.yScale)} + ${fmt(p.yOffset)}`,
  sin: (p) => `sin(x / ${fmt(p.xScale)} - ${fmt(p.xOffset)}) * ${fmt(p.yScale)} + ${fmt(p.yOffset)}`,
}

const isPlotFuncSlug = (slug: string): slug is PlotFuncSlug => {
  return (plotFuncSlugs as readonly string[]).includes(slug)
}

export function FunctionViewer() {
  const [funcSlug, setFuncSlug] = useState<PlotFuncSlug>(defaultFuncSlug)
  const [xScale, setXScale] = useState(1)
  const [xOffset, setXOffset] = useState(0)
  const [yScale, setYScale] = useState(1)
  const [yOffset, setYOffset] = useState(0)

  const onSelectFunc = (next: string) => {
    if (isPlotFuncSlug(next)) {
      setFuncSlug(next)
    }
  }

  const plotFunc: PlotFunc = {
    xOffset,
    xScale,
    yOffset,
    yScale,
    func: plotFuncs[funcSlug],
  }

  const funcOptions = plotFuncSlugs.map((slug) => ({
    value: slug,
    label: plotFuncNames[slug],
  }))

  return (
    <div className={style.page}>
      <CartesianPlane {...{ plotFunc }} />
      <div className={style.overlay}>
        <header className={style.topbar}>
          <a className={style.brand} href="#">
            <span className={style.brand_icon}>
              <SnowflakeIcon />
            </span>
            <span className={style.brand_text}>MathViz</span>
          </a>
          <div className={style.actions}>
            <SettingsMenu />
          </div>
          <div className={style.func_selector}>
            <Field className={style.func_label_hidden} label="Function" layout="inline">
              <div className={style.func_row}>
                <Select testId="func-select" value={funcSlug} onChange={onSelectFunc} options={funcOptions} />
                <output className={style.func_readout} data-testid="func-readout">
                  {`f(x) = ${plotFuncLabels[funcSlug](plotFunc)}`}
                </output>
              </div>
            </Field>
          </div>
        </header>
        <FunctionViewerSidebar
          {...{
            xScale,
            setXScale,
            xOffset,
            setXOffset,
            yScale,
            setYScale,
            yOffset,
            setYOffset,
          }}
        />
      </div>
    </div>
  )
}
