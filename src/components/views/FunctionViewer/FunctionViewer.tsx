import { useState } from "react"

import { TextField } from "#src/components/ui/TextField.tsx"

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

const plotFuncs: Record<PlotFuncSlug, (x: number) => number> = {
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

type FunctionViewerSidebarProps = {
  funcSlug: string
  onSelectFunc: (next: string) => void
  xScale: number
  setXScale: (next: number) => void
  xOffset: number
  setXOffset: (next: number) => void
  yScale: number
  setYScale: (next: number) => void
  yOffset: number
  setYOffset: (next: number) => void
}

function FunctionViewerSidebar({
  funcSlug,
  onSelectFunc,
  xScale,
  setXScale,
  xOffset,
  setXOffset,
  yScale,
  setYScale,
  yOffset,
  setYOffset,
}: FunctionViewerSidebarProps) {
  return (
    <div className={style.sidebar}>
      <Field className={style.func_select_label} label="Function">
        <Select
          testId="func-select"
          value={funcSlug}
          onChange={onSelectFunc}
          options={funcOptions}
          className={style.func_select}
        />
      </Field>
      <Field label="X Scale">
        <TextField
          testId="x-scale-input"
          {...{ value: String(xScale), onChange: (val: string) => setXScale(Number(val)) }}
        />
      </Field>
      <Field label="X Offset">
        <TextField
          testId="x-offset-input"
          {...{ value: String(xOffset), onChange: (val: string) => setXOffset(Number(val)) }}
        />
      </Field>
      <Field label="Y Scale">
        <TextField
          testId="y-scale-input"
          {...{ value: String(yScale), onChange: (val: string) => setYScale(Number(val)) }}
        />
      </Field>
      <Field label="Y Offset">
        <TextField
          testId="y-offset-input"
          {...{ value: String(yOffset), onChange: (val: string) => setYOffset(Number(val)) }}
        />
      </Field>
    </div>
  )
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
          <h1 className={style.title}>Function Viewer</h1>
          <div className={style.actions}>
            <SettingsMenu />
          </div>
        </header>
        <FunctionViewerSidebar
          funcSlug={funcSlug}
          onSelectFunc={onSelectFunc}
          xScale={xScale}
          setXScale={setXScale}
          xOffset={xOffset}
          setXOffset={setXOffset}
          yScale={yScale}
          setYScale={setYScale}
          yOffset={yOffset}
          setYOffset={setYOffset}
        />
      </div>
    </div>
  )
}
