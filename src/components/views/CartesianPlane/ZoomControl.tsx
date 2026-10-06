import { stepZoom, zoomLabel } from "./viewport.ts"
import style from "./ZoomControl.module.css"

export type ZoomControlProps = {
  zoom: number
  /** Zoom about the plane's centre to the next stop in or out. */
  onStep: (direction: 1 | -1) => void
}

// zoom-control-v2: one bordered capsule, − readout +. 100 % = 50 px per unit.
export function ZoomControl({ zoom, onStep }: ZoomControlProps) {
  return (
    <div className={style.zoom} role="group" aria-label="Zoom">
      <button
        type="button"
        className={style.step}
        aria-label="Zoom out"
        disabled={stepZoom(zoom, -1) === zoom}
        onClick={() => onStep(-1)}
        data-testid="plane-zoom-out"
      >
        −
      </button>
      <output className={style.readout} data-testid="plane-zoom">
        {zoomLabel(zoom)}
      </output>
      <button
        type="button"
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
