import { useAtom } from "jotai"
import { useEffect, useRef, type RefObject } from "react"

import type { Phrase } from "#src/components/ui/Phrases.tsx"

import { fvTourDoneAtom } from "#src/state/fvTour.ts"
import { formatNumber, formatShort, relation } from "#src/util/format/number.ts"

import type { CartesianPlaneHandle } from "../CartesianPlane/CartesianPlane"
import type { Rect } from "../CartesianPlane/rect.ts"
import type { FvAction } from "./model/reducer.ts"
import type { FvState } from "./model/state.ts"
import type { TourTargets } from "./tour/tourSteps.ts"

import { TOUR } from "./copy.ts"
import { describeEquation, equationTokens } from "./math/equation.ts"
import { curveAt } from "./model/selectors.ts"

const boxOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

export type HelpRefs = {
  /** The view's root: its parts carry data-part. */
  root: RefObject<HTMLElement | null>
  /** The panel: an explainer opens right of it, at its chip (data-chip). */
  panel: RefObject<HTMLElement | null>
  plane: RefObject<CartesianPlaneHandle | null>
}

// The help parts' wiring (decisions D12, D19). Esc closes the explainer,
// else skips the tour (FV 07, FV 08), unless a field took the Esc; an
// explainer a tap opened closes on a press anywhere but its chip and
// itself. The tour starts on a first visit once the page has painted
// (`painted`: FV 08 › Flow, after FV 05's draw-on), and once it ends
// (finished, skipped, or done by its last action) the browser remembers it.
// Gives the explainer and the tour where their targets are, and step 1's body.
export const useHelp = (
  state: FvState,
  dispatch: (action: FvAction) => void,
  refs: HelpRefs,
  painted: boolean,
) => {
  const { explainer, tour, fn, params, pX } = state

  const listening = explainer !== null || tour !== null
  useEffect(() => {
    if (!listening) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        dispatch({ type: "escape" })
      }
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [listening, dispatch])

  useEffect(() => {
    if (explainer?.by !== "tap") {
      return
    }
    const onPress = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(`[data-chip="${explainer.param}"], [data-testid^="fv-explainer-"]`) == null) {
        dispatch({ type: "explain", param: explainer.param, by: "tap", open: false })
      }
    }
    document.addEventListener("pointerdown", onPress)
    return () => document.removeEventListener("pointerdown", onPress)
  }, [explainer, dispatch])

  const [tourDone, setTourDone] = useAtom(fvTourDoneAtom)
  useEffect(() => {
    if (!tourDone && painted) {
      dispatch({ type: "tour", to: "start" })
    }
  }, [tourDone, painted, dispatch])
  const tourShown = useRef(false)
  useEffect(() => {
    if (tour !== null) {
      tourShown.current = true
    } else if (tourShown.current) {
      tourShown.current = false
      setTourDone(true)
    }
  }, [tour, setTourDone])

  const part = (name: string): Rect | null => {
    const el = refs.root.current?.querySelector(`[data-part="${name}"]`)
    return el == null ? null : boxOf(el)
  }
  const locateTour = (): TourTargets => ({
    equation: part("equation"),
    control: part("control-k"),
    plane: part("plane"),
    qCard: part("q-card"),
    curve: refs.plane.current?.regionOf(["f", "p"]) ?? null,
  })
  const locateChip = (): { chip: Rect; panel: Rect } | null => {
    const panel = refs.panel.current
    const chip = explainer === null ? null : panel?.querySelector(`[data-chip="${explainer.param}"]`)
    return chip == null || panel === null ? null : { chip: boxOf(chip), panel: boxOf(panel) }
  }
  const pY = curveAt(state, pX)
  const tourBody: readonly Phrase[] | null =
    tour === null
      ? null
      : tour.step === 1
        ? TOUR.steps[1].body(
            describeEquation(equationTokens(fn, params, "live")),
            `f(${formatNumber(pX)}) ${relation(pY)} ${formatShort(pY)}`,
          )
        : TOUR.steps[tour.step].body
  return { locateChip, locateTour, tourBody }
}
