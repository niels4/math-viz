import { useEffect, useState } from "react"

import { canAnimate } from "../CartesianPlane/hooks/usePlotCurves"
import { loopAt, welcomeStill, type LoopState } from "./welcomeLoop"

const firstFrameMs = 1000 / 60
const maxFrameMs = 50

export const useWelcomeLoop = (): LoopState => {
  const animate = canAnimate()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!animate) {
      return
    }
    let last: number | null = null
    let frame = 0
    const step = (now: number) => {
      const dt = last === null ? firstFrameMs : Math.min(now - last, maxFrameMs)
      last = now
      setElapsed((e) => e + dt)
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [animate])

  return animate ? loopAt(elapsed) : welcomeStill
}
