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

// Inner input: only show xScale/xOffset when off their defaults (1 / 0).
// Negative offsets flip the sign so `x - -2` reads as `x + 2`.
const innerX = (p: PlotFunc): string => {
  const scaleDefault = p.xScale === 1
  const offsetDefault = p.xOffset === 0
  if (scaleDefault && offsetDefault) {
    return "x"
  }
  if (scaleDefault) {
    return p.xOffset > 0 ? `x - ${fmt(p.xOffset)}` : `x + ${fmt(-p.xOffset)}`
  }
  const scaled = `x / ${fmt(p.xScale)}`
  if (offsetDefault) {
    return scaled
  }
  return p.xOffset > 0 ? `${scaled} - ${fmt(p.xOffset)}` : `${scaled} + ${fmt(-p.xOffset)}`
}

// Outer output: only show yScale/yOffset when off their defaults (1 / 0).
const withY = (base: string, p: PlotFunc): string => {
  const scaled = p.yScale === 1 ? base : `${base} * ${fmt(p.yScale)}`
  if (p.yOffset === 0) {
    return scaled
  }
  return p.yOffset > 0 ? `${scaled} + ${fmt(p.yOffset)}` : `${scaled} - ${fmt(-p.yOffset)}`
}

const plotFuncLabels: Record<PlotFuncSlug, (p: PlotFunc) => string> = {
  x: (p) => {
    const inner = innerX(p)
    const base = inner === "x" || p.yScale === 1 ? inner : `(${inner})`
    return withY(base, p)
  },
  x2: (p) => {
    const inner = innerX(p)
    return withY(inner === "x" ? "x²" : `(${inner})²`, p)
  },
  x3: (p) => {
    const inner = innerX(p)
    return withY(inner === "x" ? "x³" : `(${inner})³`, p)
  },
  sin: (p) => withY(`sin(${innerX(p)})`, p),
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
