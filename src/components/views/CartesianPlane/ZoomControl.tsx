import { useState, type KeyboardEvent } from "react"

import { stepZoom, ZOOM_STOPS, zoomLabel, zoomPercent } from "./viewport.ts"
import style from "./ZoomControl.module.css"

export type ZoomControlProps = {
  zoom: number
  /** Zoom about the plane's centre to the next stop in or out. */
  onStep: (direction: 1 | -1) => void
}

/** The control's keys: ↑ → + zoom in, ↓ ← − zoom out, as the plane's + and −. */
const ZOOM_KEYS: Readonly<Record<string, 1 | -1>> = {
  ArrowUp: 1,
  ArrowRight: 1,
  "+": 1,
  "=": 1,
  ArrowDown: -1,
  ArrowLeft: -1,
  "-": -1,
  _: -1,
}

const LOWEST = zoomPercent(ZOOM_STOPS[0] ?? 1)
const HIGHEST = zoomPercent(ZOOM_STOPS.at(-1) ?? 100)

// zoom-control-v2: one bordered capsule, − readout +. 100 % = 50 px per unit.
// One tab stop (FV 07): the capsule is a spin button over the zoom stops
// (↑ → + in, ↓ ← − out) and draws the focus ring; − and + serve the pointer.
// The readout says a new zoom aloud (a status) unless the capsule has the
// focus, which says it itself.
export function ZoomControl({ zoom, onStep }: ZoomControlProps) {
  const [focused, setFocused] = useState(false)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = ZOOM_KEYS[event.key]
    if (event.target !== event.currentTarget || direction === undefined) {
      return
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return
    }
    event.preventDefault()
    onStep(direction)
  }
  return (
    <div
      className={style.zoom}
      role="spinbutton"
      tabIndex={0}
      aria-label="Zoom"
      aria-valuenow={zoomPercent(zoom)}
      aria-valuetext={zoomLabel(zoom)}
      aria-valuemin={LOWEST}
      aria-valuemax={HIGHEST}
      onKeyDown={onKeyDown}
      onFocus={(event) => setFocused(event.target === event.currentTarget)}
      onBlur={() => setFocused(false)}
      data-testid="plane-zoom-control"
    >
      <button
        type="button"
        tabIndex={-1}
        className={style.step}
        aria-label="Zoom out"
        disabled={stepZoom(zoom, -1) === zoom}
        onClick={() => onStep(-1)}
        data-testid="plane-zoom-out"
      >
        −
      </button>
      <output className={style.readout} aria-live={focused ? "off" : undefined} data-testid="plane-zoom">
        {zoomLabel(zoom)}
      </output>
      <button
        type="button"
        tabIndex={-1}
        className={style.step}
        aria-label="Zoom in"
        disabled={stepZoom(zoom, 1) === zoom}
        onClick={() => onStep(1)}
        data-testid="plane-zoom-in"
      >
        +
      </button>
    </div>
  )
}
