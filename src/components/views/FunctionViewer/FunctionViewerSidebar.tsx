import type { Extent } from "../CartesianPlane/viewport.ts"

import { ExtentSlider } from "../../ui/ExtentSlider.tsx"
import { Field } from "../../ui/Field"
import { NumberField } from "../../ui/NumberField.tsx"
import { SECTIONS } from "./copy.ts"
import style from "./FunctionViewer.module.css"
import { PanelSection } from "./panel/PanelSection.tsx"

export type FunctionViewerSidebarProps = {
  point1X: number
  setPoint1X: (next: number) => void
  point2X: number | null
  xExtent: Pick<Extent, "minX" | "maxX"> | null
}

export function FunctionViewerSidebar({ point1X, setPoint1X, point2X, xExtent }: FunctionViewerSidebarProps) {
  return (
    <PanelSection {...SECTIONS.points}>
      <Field label="p1">
        <div className={style.control_row}>
          <NumberField testId="p1-input" label="p1" value={point1X} onCommit={setPoint1X} />
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
        <output data-testid="p2-readout">{point2X === null ? "Hover the chart" : point2X.toFixed(2)}</output>
      </Field>
    </PanelSection>
  )
}
