import { useEffect, useState } from "react"

import { Field } from "#src/components/ui/Field.tsx"
import { Select } from "#src/components/ui/Select.tsx"
import stixStyles from "#src/style/fonts/stix_two_text/stix_two_text.module.css"

import type { PlotFunc, XExtent } from "./CartesianPlane/types"

import { CartesianPlane } from "./CartesianPlane/CartesianPlane"
import { describeFormula } from "./describeFormula.ts"
import { FunctionFormula } from "./FunctionFormula.tsx"
import style from "./FunctionViewer.module.css"
import { FunctionViewerSidebar } from "./FunctionViewerSidebar.tsx"
import { SnowflakeIcon } from "./ui/icons.tsx"
import { SettingsMenu } from "./ui/SettingsMenu.tsx"

const plotFuncSlugs = ["x", "x2", "x3", "sin"] as const

const defaultFuncSlug = plotFuncSlugs[1]

type PlotFuncSlug = (typeof plotFuncSlugs)[number]

const plotFuncs: Record<PlotFuncSlug, (x: number) => number> = {
  x: (x) => x,
  x2: (x) => x ** 2,
  x3: (x) => x ** 3,
  sin: (x) => Math.sin(x),
} as const

const plotFuncNames: Record<PlotFuncSlug, string> = {
  x: "x",
  x2: "x²",
  x3: "x³",
  sin: "sin(x)",
}

const isPlotFuncSlug = (slug: string): slug is PlotFuncSlug => {
  return (plotFuncSlugs as readonly string[]).includes(slug)
}

export function FunctionViewerAlpha() {
  const [funcSlug, setFuncSlug] = useState<PlotFuncSlug>(defaultFuncSlug)
  const [xScale, setXScale] = useState(1)
  const [xOffset, setXOffset] = useState(0)
  const [yScale, setYScale] = useState(1)
  const [yOffset, setYOffset] = useState(0)
  const [point1X, setPoint1X] = useState(0)
  const [point2X, setPoint2X] = useState<number | null>(null)
  const [xExtent, setXExtent] = useState<XExtent | null>(null)

  useEffect(() => {
    console.log("point1", point1X)
  }, [point1X])

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
              <output
                className={`${style.func_readout} ${stixStyles.font}`}
                data-testid="func-readout"
                aria-label={describeFormula(funcSlug, plotFunc)}
              >
                <FunctionFormula slug={funcSlug} plotFunc={plotFunc} />
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
          point1X,
          setPoint1X,
          point2X,
          xExtent,
        }}
      />
      <main className={style.main}>
        <CartesianPlane
          {...{ plotFunc, onExtentChange: setXExtent, point1X, onPoint2Change: setPoint2X }}
          point2X={point2X ?? undefined}
        />
      </main>
    </div>
  )
}
