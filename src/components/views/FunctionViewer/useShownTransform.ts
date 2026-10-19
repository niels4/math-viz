import { useAtomValue } from "jotai"
import { useEffect, useState } from "react"

import type { Transform } from "./transformCurves"

import { canAnimate } from "../CartesianPlane/usePlotCurves"
import { jumpsAtom, type TransformParam } from "./state"

const durationMs = 1000
const springSettleMs = 702
const firstFrameMs = 1000 / 60
const stiffness = 170
const damping = 26

const decay = damping / 2
const ringing = Math.sqrt(stiffness - decay ** 2)

const springAt = (ms: number) => {
  const t = ((ms / durationMs) * springSettleMs) / 1000
  return 1 - Math.exp(-decay * t) * (Math.cos(ringing * t) + (decay / ringing) * Math.sin(ringing * t))
}

type Jump = { from: Transform; to: Transform; elapsed: number }

const shownDuring = (jump: Jump | null, transform: Transform): Transform => {
  if (jump === null) {
    return transform
  }
  const share = springAt(jump.elapsed)
  const at = (p: TransformParam) =>
    transform[p] === jump.to[p] ? jump.from[p] + (jump.to[p] - jump.from[p]) * share : transform[p]
  return { a: at("a"), b: at("b"), h: at("h"), k: at("k") }
}

export const useShownTransform = (transform: Transform): Transform => {
  const jumps = useAtomValue(jumpsAtom)
  const [seenJumps, setSeenJumps] = useState(jumps)
  const [jump, setJump] = useState<Jump | null>(null)
  if (jumps !== seenJumps) {
    setSeenJumps(jumps)
    if (canAnimate()) {
      const ends = (end: "from" | "to") => jumps.reduce((t, j) => ({ ...t, [j.param]: j[end] }), transform)
      setJump({ from: shownDuring(jump, ends("from")), to: ends("to"), elapsed: 0 })
    }
  }

  const jumping = jump !== null
  useEffect(() => {
    if (!jumping) {
      return
    }
    let last: number | null = null
    let frame = 0
    const step = (now: number) => {
      const dt = last === null ? firstFrameMs : now - last
      last = now
      setJump((j) => (j === null || j.elapsed + dt >= durationMs ? null : { ...j, elapsed: j.elapsed + dt }))
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [jumping])

  return shownDuring(jump, transform)
}
