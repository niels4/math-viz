import type { ReactNode } from "react"

import robotoMonoStyles from "#src/style/fonts/roboto_mono/roboto_mono.module.css"
import stixStyles from "#src/style/fonts/stix_two_text/stix_two_text.module.css"

import { hudTicks } from "./chrome.ts"
import style from "./PlaneChrome.module.css"
import { SCALE_BAR_PX, scaleLabel } from "./viewport.ts"

// 24 px arms 12 px in from each corner; each SVG sits 10 px in, so the 2.5 px
// square-capped stroke fits inside it.
const BRACKET_PATHS = {
  top_left: "M2 26V2H26",
  top_right: "M2 2H26V26",
  bottom_left: "M2 2V26H26",
  bottom_right: "M26 2V26H2",
} as const

export type PlaneChromeProps = {
  width: number
  height: number
  zoom: number
  /** Caps label of the caption plate. */
  label: string
  /** Maths beside the label. */
  caption?: ReactNode
}

// canvas-chrome-v2 over the plane: corner brackets, HUD ticks (shown where
// --sig-hud-ticks is 1, tron-cyan), the caption plate top-left and the scale
// bar bottom-left. Parts marked data-keep-out push tick labels away.
export function PlaneChrome({ width, height, zoom, label, caption }: PlaneChromeProps) {
  return (
    <>
      {(["top_left", "top_right", "bottom_left", "bottom_right"] as const).map((corner) => (
        <svg
          key={corner}
          className={`${style.bracket} ${style[corner]}`}
          viewBox="0 0 28 28"
          aria-hidden="true"
          data-keep-out
        >
          <path d={BRACKET_PATHS[corner]} />
        </svg>
      ))}
      <svg className={style.hud} width={width} height={height} aria-hidden="true">
        <path d={hudTicks(width, height)} />
      </svg>
      <div className={style.caption} data-keep-out>
        <span className={style.caption_label}>{label}</span>
        {caption === undefined ? null : (
          <span className={`${style.caption_math} ${stixStyles.font}`}>{caption}</span>
        )}
      </div>
      <div className={style.scale} data-keep-out>
        <svg className={style.scale_bar} width={SCALE_BAR_PX} height={10} aria-hidden="true">
          <path d={`M1 1V9H${SCALE_BAR_PX - 1}V1`} />
        </svg>
        <span className={`${style.scale_label} ${robotoMonoStyles.font}`}>{scaleLabel(zoom)}</span>
      </div>
    </>
  )
}
