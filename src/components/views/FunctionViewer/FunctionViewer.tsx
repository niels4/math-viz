import { useState } from "react"

import type { PlotFunc } from "../CartesianPlane/types"

import { Field } from "../../ui/Field"
import { SnowflakeIcon } from "../../ui/icons.tsx"
import { NumberField } from "../../ui/NumberField.tsx"
import { ScrubStrip } from "../../ui/ScrubStrip.tsx"
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
        <div className={style.control_row}>
          <NumberField testId="x-scale-input" {...{ value: xScale, onChange: setXScale }} />
          <ScrubStrip
            testId="x-scale-strip"
            label="Scrub X scale"
            kind="multiplicative"
            step={0.002}
            defaultValue={1}
            helpText="Drag to scrub the scale. Large values move faster than small ones, and the sign never flips. Shift for fine control, Ctrl snaps to whole numbers, double-click resets to 1."
            {...{ value: xScale, onChange: setXScale }}
          />
        </div>
      </Field>
      <Field label="X Offset">
        <div className={style.control_row}>
          <NumberField testId="x-offset-input" {...{ value: xOffset, onChange: setXOffset }} />
          <ScrubStrip
            testId="x-offset-strip"
            label="Scrub X offset"
            kind="additive"
            step={0.02}
            defaultValue={0}
            helpText="Drag to scrub the offset. Shift for fine control, Ctrl snaps to whole numbers, double-click resets to 0."
            {...{ value: xOffset, onChange: setXOffset }}
          />
        </div>
      </Field>
      <Field label="Y Scale">
        <div className={style.control_row}>
          <NumberField testId="y-scale-input" {...{ value: yScale, onChange: setYScale }} />
          <ScrubStrip
            testId="y-scale-strip"
            label="Scrub Y scale"
            kind="multiplicative"
            step={0.002}
            defaultValue={1}
            helpText="Drag to scrub the scale. Large values move faster than small ones, and the sign never flips. Shift for fine control, Ctrl snaps to whole numbers, double-click resets to 1."
            {...{ value: yScale, onChange: setYScale }}
          />
        </div>
      </Field>
      <Field label="Y Offset">
        <div className={style.control_row}>
          <NumberField testId="y-offset-input" {...{ value: yOffset, onChange: setYOffset }} />
          <ScrubStrip
            testId="y-offset-strip"
            label="Scrub Y offset"
            kind="additive"
            step={0.02}
            defaultValue={0}
            helpText="Drag to scrub the offset. Shift for fine control, Ctrl snaps to whole numbers, double-click resets to 0."
            {...{ value: yOffset, onChange: setYOffset }}
          />
        </div>
      </Field>
      <p className={style.scrub_hint}>Drag a strip to scrub · Shift fine · Ctrl snap · double-click resets</p>
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
          {...{
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
          }}
        />
      </div>
    </div>
  )
}
