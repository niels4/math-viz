import { useState, type KeyboardEvent } from "react"

import { LocateIcon } from "#src/components/ui/icons.tsx"

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

// The zoom stacked as Google Maps stacks it (the user's ruling, 2026-10-07,
// over figma0's zoom-control-v2 row): one bordered capsule, + over −, and no
// number, which changed width as the zoom changed. One tab stop (FV 07): the
// capsule is a spin button over the zoom stops (↑ → + in, ↓ ← − out) and
// draws the focus ring; + and − serve the pointer. Screen readers still hear
// the zoom: the spin button's value, and an unseen status that says a new
// zoom aloud unless the capsule has the focus, which says it itself.
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
        aria-label="Zoom in"
        disabled={stepZoom(zoom, 1) === zoom}
        onClick={() => onStep(1)}
        data-testid="plane-zoom-in"
      >
        +
      </button>
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
      <output className={style.status} aria-live={focused ? "off" : undefined} data-testid="plane-zoom">
        {zoomLabel(zoom)}
      </output>
    </div>
  )
}

/**
 * Back to the origin, as Google Maps' locate button goes back to you (the
 * user's ruling, 2026-10-07): the view centres on (0, 0) and keeps its zoom.
 * The plane's 0 key resets both.
 */
export function OriginButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={style.origin}
      aria-label="Return to origin"
      onClick={onClick}
      data-testid="plane-origin"
    >
      <LocateIcon />
    </button>
  )
}
