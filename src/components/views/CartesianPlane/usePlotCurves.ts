import { useEffect, useState } from "react"

import type { PlotCurve, PlotFunction } from "./drawCartesianPlane"

// A function switch, timed as in math-viz: the old curve fades out over
// fadeMs while the new one draws on from the left over drawMs.
const fadeMs = 160
const drawMs = 900
// The first frame of a switch counts as one frame in, as in useCamera.
const firstFrameMs = 1000 / 60

// Ease-in-out cubic, the curve behind math-viz's draw-on ease,
// cubic-bezier(0.65, 0, 0.35, 1).
const easeDraw = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2)

// Reduced motion, or no animation frames (jsdom), shows a new curve at once.
const canAnimate = () =>
  typeof requestAnimationFrame === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches

// The function shown, and while it switches, the one before it and the ms
// since the switch began.
type Shown = { fn: PlotFunction; old: PlotFunction | null; elapsed: number }

// The curves the plane draws for plotFunction. When it changes, the old curve
// fades out under the new one, which draws on from the left. A change during
// a switch fades the curve shown, whole, and starts the draw-on again.
export const usePlotCurves = (plotFunction: PlotFunction): readonly PlotCurve[] => {
  const [shown, setShown] = useState<Shown>({ fn: plotFunction, old: null, elapsed: 0 })
  // Set during render, so no frame shows the new curve whole before it draws on.
  if (shown.fn !== plotFunction) {
    setShown({ fn: plotFunction, old: canAnimate() ? shown.fn : null, elapsed: 0 })
  }

  // One frame loop for as long as a switch runs, a restart included: each
  // frame adds its time to the switch's elapsed.
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
