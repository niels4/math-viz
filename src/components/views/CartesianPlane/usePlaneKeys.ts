import type { Dispatch, KeyboardEvent, SetStateAction } from "react"

import type { PanApi } from "./usePan.ts"

import { gridSteps } from "./grid.ts"
import { stepZoom } from "./viewport.ts"

export type PlaneKeysOptions = {
  zoom: number
  setZoom: Dispatch<SetStateAction<number>>
  pan: PanApi
  /** Back to the default view: D17's zoom, origin centred. */
  resetView: () => void
}

// FV 07's plane keys: arrows pan one grid square, + and − zoom about the
// centre through the zoom stops, 0 resets the view. Keys with Ctrl, Meta or
// Alt stay the browser's (Ctrl + is page zoom).
export function usePlaneKeys({ zoom, setZoom, pan, resetView }: PlaneKeysOptions) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget || e.ctrlKey || e.metaKey || e.altKey) {
      return
    }
    // The view moves the way the arrow points: → shows larger x.
    const square = gridSteps(zoom).minor
    const actions: Record<string, () => void> = {
      ArrowLeft: () => pan.setPanX((x) => x + square),
      ArrowRight: () => pan.setPanX((x) => x - square),
      ArrowUp: () => pan.setPanY((y) => y - square),
      ArrowDown: () => pan.setPanY((y) => y + square),
      "+": () => setZoom((z) => stepZoom(z, 1)),
      "=": () => setZoom((z) => stepZoom(z, 1)),
      "-": () => setZoom((z) => stepZoom(z, -1)),
      _: () => setZoom((z) => stepZoom(z, -1)),
      "0": resetView,
    }
    const action = actions[e.key]
    if (action === undefined) {
      return
    }
    e.preventDefault()
    pan.stopInertia()
    action()
  }
}
