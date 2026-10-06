import type { HelpContent } from "../../ui/HelpTip.tsx"
import type { Extent } from "../CartesianPlane/viewport.ts"

import { ExtentSlider } from "../../ui/ExtentSlider.tsx"
import { Field } from "../../ui/Field"
import { NumberField } from "../../ui/NumberField.tsx"
import { ScrubStrip } from "../../ui/ScrubStrip.tsx"
import style from "./FunctionViewer.module.css"

const scaleHelp: HelpContent = {
  title: "Scrub the scale",
  rows: [
    { keys: "drag", text: "scrub the value" },
    { keys: "Shift drag", text: "fine control" },
    { keys: "Ctrl drag", text: "snap to whole numbers" },
    { keys: "2×click", text: "reset to 1" },
  ],
}

const offsetHelp: HelpContent = {
  title: "Scrub the offset",
  rows: [
    { keys: "drag", text: "scrub the value" },
    { keys: "Shift drag", text: "fine control" },
    { keys: "Ctrl drag", text: "snap to whole numbers" },
    { keys: "2×click", text: "reset to 0" },
  ],
}

export type FunctionViewerSidebarProps = {
  xScale: number
  setXScale: (next: number) => void
  xOffset: number
  setXOffset: (next: number) => void
  yScale: number
  setYScale: (next: number) => void
  yOffset: number
  setYOffset: (next: number) => void
  point1X: number
  setPoint1X: (next: number) => void
  point2X: number | null
  xExtent: Pick<Extent, "minX" | "maxX"> | null
}

export function FunctionViewerSidebar({
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
}: FunctionViewerSidebarProps) {
  return (
    <div className={style.sidebar}>
      <section className={style.section} aria-label="Function Transforms">
        <h2 className={style.section_title}>Function Transforms</h2>
        <Field label="X Scale">
          <div className={style.control_row}>
            <NumberField testId="x-scale-input" {...{ value: xScale, onChange: setXScale }} />
            <ScrubStrip
              testId="x-scale-strip"
              label="Scrub X scale"
              kind="multiplicative"
              step={0.002}
              defaultValue={1}
              help={scaleHelp}
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
              help={offsetHelp}
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
              help={scaleHelp}
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
              help={offsetHelp}
              {...{ value: yOffset, onChange: setYOffset }}
            />
          </div>
        </Field>
        <p className={style.scrub_hint}>
          Drag a strip to scrub · Shift fine · Ctrl snap · double-click resets
        </p>
      </section>
      <section className={style.section} aria-label="Points">
        <h2 className={style.section_title}>Points</h2>
        <Field label="p1">
          <div className={style.control_row}>
            <NumberField testId="p1-input" {...{ value: point1X, onChange: setPoint1X }} />
            <ExtentSlider
              testId="p1-slider"
              label="p1 position"
              value={point1X}
              min={xExtent?.minX ?? 0}
              max={xExtent?.maxX ?? 0}
              onChange={setPoint1X}
            />
          </div>
        </Field>
        <Field label="p2">
          <output data-testid="p2-readout">
            {point2X === null ? "Hover the chart" : point2X.toFixed(2)}
          </output>
        </Field>
      </section>
    </div>
  )
}
