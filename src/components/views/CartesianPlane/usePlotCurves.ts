import { useEffect, useState } from "react"

import type { PlotCurve, PlotFunction } from "./drawCartesianPlane"

const fadeMs = 160
const drawMs = 900
const firstFrameMs = 1000 / 60

const easeDraw = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2)

const canAnimate = () =>
  typeof requestAnimationFrame === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches

type Shown = { fn: PlotFunction; old: PlotFunction | null; elapsed: number }

export const usePlotCurves = (plotFunction: PlotFunction): readonly PlotCurve[] => {
  const [shown, setShown] = useState<Shown>({ fn: plotFunction, old: null, elapsed: 0 })
  if (shown.fn !== plotFunction) {
    setShown({ fn: plotFunction, old: canAnimate() ? shown.fn : null, elapsed: 0 })
  }

  const switching = shown.old !== null
  useEffect(() => {
    if (!switching) {
      return
    }
    let last: number | null = null
    let frame = 0
    const step = (now: number) => {
      const dt = last === null ? firstFrameMs : now - last
      last = now
      setShown((s) =>
        s.elapsed + dt >= drawMs ? { ...s, old: null, elapsed: 0 } : { ...s, elapsed: s.elapsed + dt },
      )
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [switching])

  const { fn, old, elapsed } = shown
  if (old === null) {
    return [{ fn, alpha: 1, drawTo: 1 }]
  }
  const oldAlpha = 1 - elapsed / fadeMs
  const curve = { fn, alpha: 1, drawTo: easeDraw(elapsed / drawMs) }
  return oldAlpha > 0 ? [{ fn: old, alpha: oldAlpha, drawTo: 1 }, curve] : [curve]
}
