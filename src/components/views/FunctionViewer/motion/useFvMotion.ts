import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { useRef, useState, type RefObject } from "react"

import { motionLevel, type MotionLevel } from "#src/util/motion/motion.ts"

import type { CartesianPlaneHandle } from "../../CartesianPlane/CartesianPlane"
import type { TransformParam } from "../math/form.ts"
import type { FvState } from "../model/state.ts"
import type { PlaneSceneInput } from "../planeScene.ts"

import { TRANSFORM_PARAMS } from "../math/form.ts"
import {
  AT_REST,
  FLASH,
  flashAt,
  ghostShareAt,
  isMoving,
  motionScene,
  nudgeAt,
  qLookAt,
  settle,
  shownParams,
  type FvMotionLayers,
} from "./fvMotion.ts"

/** The view's values the motion watches, as last committed. */
type Seen = Pick<FvState, "fn" | "params" | "pX" | "qX" | "ghostOn">

/** One clock for every layer: seconds. */
const seconds = () => performance.now() / 1000

export type FvMotionRefs = {
  plane: RefObject<CartesianPlaneHandle | null>
  /** The view's root: its rulers (data-nudge) and its equation card (data-part="equation"). */
  root: RefObject<HTMLElement | null>
}

/** How the motion reads a change: the layers after it, and the terms it flashes. */
const onChange = (
  layers: FvMotionLayers,
  seen: Seen,
  state: FvState,
  now: number,
  level: MotionLevel,
): { layers: FvMotionLayers; flashes: readonly TransformParam[] } => {
  const { fn, params, pX, qX, ghostOn } = state
  let next = layers
  let flashes: readonly TransformParam[] = []
  if (fn !== seen.fn) {
    // The old curve fades as it was shown; the new one draws on.
    next = {
      ...next,
      paint: null,
      jump: null,
      switch:
        level === "full" ? { fn: seen.fn, params: shownParams(seen.params, next, now), start: now } : null,
    }
  } else if (params !== seen.params) {
    const changed = TRANSFORM_PARAMS.filter((p) => params[p] !== seen.params[p])
    if (state.change === "jump" && level === "full") {
      next = {
        ...next,
        paint: null,
        jump: { from: shownParams(seen.params, next, now), to: params, start: now },
      }
    } else if (next.jump !== null) {
      // A direct change takes its values at once; the others keep springing.
      const from = { ...next.jump.from }
      const to = { ...next.jump.to }
      for (const p of changed) {
        from[p] = params[p]
        to[p] = params[p]
      }
      next = { ...next, paint: null, jump: { ...next.jump, from, to } }
    } else {
      next = { ...next, paint: null }
    }
    // FV 04: a change flashes its term; a drag's terms are lit already.
    if (state.drag === null) {
      flashes = changed
    }
  }
  if (pX !== seen.pX) {
    next = { ...next, paint: null }
  }
  if ((qX === null) !== (seen.qX === null)) {
    const alpha = next.q === null ? (seen.qX === null ? 0 : 1) : qLookAt(next, now, level).alpha
    next = {
      ...next,
      q:
        qX === null
          ? { dir: "out", x: seen.qX ?? 0, from: alpha, start: now }
          : { dir: "in", x: qX, from: alpha, start: now },
    }
  }
  if (ghostOn !== seen.ghostOn) {
    const ghost = next.ghost
    const from =
      ghost === null ? (seen.ghostOn ? 1 : 0) : ghostShareAt(now - ghost.start, ghost.from, ghost.to, level)
    next = { ...next, ghost: { from, to: ghostOn ? 1 : 0, start: now } }
  }
  return { layers: next, flashes }
}

/**
 * Every authored motion of the Function Viewer (FV 05) on GSAP's ticker:
 * the first paint, value jumps, the function switch, Q entering and
 * leaving, the Original's fade, the changed term's flash and the rulers'
 * nudge. A change moves as the reducer tags it (`change`): drags, keys and
 * the wheel stay 1 : 1. Each tick draws fvMotion's frame through the
 * plane's drawFrame and writes the nudges and flashes into the DOM; nothing
 * renders per frame. Under reduced motion only fades of 120 ms remain;
 * where there is no matchMedia (jsdom) nothing moves. Returns whether the
 * first paint is over: the tour waits for it (FV 08 › Flow).
 */
export const useFvMotion = (state: FvState, input: PlaneSceneInput, refs: FvMotionRefs): boolean => {
  const [painted, setPainted] = useState(() => motionLevel() !== "full")
  const layersRef = useRef<FvMotionLayers>(AT_REST)
  const flashesRef = useRef(new Map<TransformParam, number>())
  const seenRef = useRef<Seen | null>(null)
  const inputRef = useRef(input)
  const viewRef = useRef(state.view)
  /** The tick registered on GSAP's ticker while anything moves. */
  const tickRef = useRef<(() => void) | null>(null)
  /** The plane holds a frame of ours; the rulers are nudged; the first paint is over. */
  const heldRef = useRef(false)
  const nudgedRef = useRef(false)
  const paintedRef = useRef(painted)

  const { fn, params, pX, qX, ghostOn, view } = state

  useGSAP(
    () => {
      const { plane, root } = refs

      // The rulers' sliding parts, by ruler in DOM order.
      const nudge = (t: number | null) => {
        if (t === null && !nudgedRef.current) {
          return
        }
        const rulers: Element[] = []
        for (const part of root.current?.querySelectorAll<HTMLElement | SVGElement>("[data-nudge]") ?? []) {
          const ruler = part.closest('[role="slider"]') ?? part
          if (!rulers.includes(ruler)) {
            rulers.push(ruler)
          }
          const x = t === null ? 0 : nudgeAt(t, rulers.indexOf(ruler))
          part.style.transform = x === 0 ? "" : `translateX(${x}px)`
        }
        nudgedRef.current = t !== null
      }

      // Each changed term's plate, in both lines, through --flash.
      const flash = (now: number, level: MotionLevel): boolean => {
        for (const [param, start] of flashesRef.current) {
          const t = now - start
          const done = t >= FLASH.end
          const terms = root.current?.querySelectorAll<HTMLElement>(
            `[data-part="equation"] [data-param="${param}"]`,
          )
          for (const term of terms ?? []) {
            if (done) {
              term.style.removeProperty("--flash")
            } else {
              term.style.setProperty("--flash", String(flashAt(t, level)))
            }
          }
          if (done) {
            flashesRef.current.delete(param)
          }
        }
        return flashesRef.current.size > 0
      }

      const stop = () => {
        if (tickRef.current !== null) {
          gsap.ticker.remove(tickRef.current)
          tickRef.current = null
        }
      }

      const tick = () => {
        const now = seconds()
        const level = motionLevel()
        const layers = settle(layersRef.current, now, level)
        layersRef.current = layers
        nudge(layers.paint === null ? null : now - layers.paint)
        const flashing = flash(now, level)
        const moving = isMoving(layers)
        if (moving) {
          plane.current?.drawFrame(motionScene(inputRef.current, layers, now, viewRef.current, level))
          heldRef.current = true
        } else if (heldRef.current) {
          plane.current?.drawFrame(null)
          heldRef.current = false
        }
        if (layers.paint === null && !paintedRef.current) {
          paintedRef.current = true
          setPainted(true)
        }
        if (!moving && !flashing) {
          stop()
        }
      }

      // The first frame draws now, before the browser paints; then every tick.
      const wake = () => {
        if (tickRef.current === null) {
          tickRef.current = tick
          gsap.ticker.add(tick)
        }
        tick()
      }

      inputRef.current = input
      viewRef.current = view
      const seen = seenRef.current
      seenRef.current = { fn, params, pX, qX, ghostOn }
      const level = motionLevel()
      if (level === "none") {
        return
      }
      const now = seconds()
      if (seen === null) {
        // The first paint (FV 05 › Draw-on timeline), with full motion only.
        if (level === "full") {
          layersRef.current = { ...AT_REST, paint: now }
          wake()
        }
        return
      }
      const next = onChange(settle(layersRef.current, now, level), seen, state, now, level)
      layersRef.current = next.layers
      for (const p of next.flashes) {
        flashesRef.current.set(p, now)
      }
      if (isMoving(next.layers) || flashesRef.current.size > 0) {
        wake()
      }
    },
    { dependencies: [fn, params, pX, qX, ghostOn, input, view] },
  )

  // Unmounting (StrictMode's rehearsal too) stops the ticker, and a mount
  // after it paints from the start.
  useGSAP(
    () => () => {
      if (tickRef.current !== null) {
        gsap.ticker.remove(tickRef.current)
        tickRef.current = null
      }
      seenRef.current = null
      layersRef.current = AT_REST
      flashesRef.current.clear()
      heldRef.current = false
    },
    [],
  )

  return painted
}
