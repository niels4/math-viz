import type { CalloutCaret } from "#src/components/ui/Callout.tsx"

import type { Rect } from "../../CartesianPlane/rect.ts"
import type { FvTourStep } from "../model/state.ts"

// Decision D19, the first-minute tour (figma0 FV 08; R1): what each step
// spotlights and where its card goes, as figma0's builder places them,
// relative to the parts on the page so the steps follow the layout. Pure,
// in viewport px.

/** FV 08 › Flow: step 1 moves on after this long without input. */
export const TOUR_IDLE_MS = 6000

export const TOUR_STEPS: readonly FvTourStep[] = [1, 2, 3]

/** The card is 340 wide; its caret 10 deep and 18 across. */
export const TOUR_CARD = { width: 340, caret: 10 } as const

/** A hole is its target grown 8 px each way, with 12 px corners (the spotlight's boolean cut). */
export const HOLE_PAD = 8
export const HOLE_RADIUS = 12

/** Step 2's ghost hand: 26 px drawn at 1.6×, on the ruler where a hand would grab it. */
export const HAND_SIZE = 26 * 1.6

/** Cards keep this far inside the window. */
const MARGIN = 16

/** What the steps point at, in viewport px; null where it isn't on the page. */
export type TourTargets = {
  equation: Rect | null
  /** k's control: chip, name, value and ruler. */
  control: Rect | null
  plane: Rect | null
  /** Q's card. */
  qCard: Rect | null
  /** The plane's curve and P as drawn, with the axis labels beside them (the plane's regionOf). */
  curve: Rect | null
}

export type TourLayout = {
  /** The spotlight's holes, padded. */
  holes: Rect[]
  /** The card's top-left and its caret; null when its target isn't on the page. */
  card: { x: number; y: number; caret: CalloutCaret } | null
  /** Step 2's ghost hand's top-left. */
  hand: { x: number; y: number } | null
}

const pad = (r: Rect): Rect => ({
  x: r.x - HOLE_PAD,
  y: r.y - HOLE_PAD,
  w: r.w + 2 * HOLE_PAD,
  h: r.h + 2 * HOLE_PAD,
})

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(v, hi))

type View = { width: number; height: number }

/**
 * Right of a target by `gap` (to the caret's tip), `dy` below its top, the
 * caret at the card's middle (FV 08's row, centred). Kept inside the window,
 * the caret still where it was aimed; under the target, caret up, where
 * the window has no room on its right.
 */
const beside = (target: Rect, gap: number, dy: number, height: number, view: View) => {
  const { width, caret } = TOUR_CARD
  const x = target.x + target.w + gap + caret
  if (x + width + MARGIN <= view.width) {
    const aim = target.y + dy + height / 2
    const y = clamp(target.y + dy, MARGIN, view.height - MARGIN - height)
    return { x, y, caret: { side: "left", at: clamp(aim - y, caret, height - caret) } as const }
  }
  const left = clamp(target.x, MARGIN, view.width - MARGIN - width)
  return { x: left, y: target.y + target.h + gap + caret, caret: { side: "top", at: 9 } as const }
}

/** Each step's holes, card and hand, for a card `height` tall. */
export const tourLayout = (
  step: FvTourStep,
  targets: TourTargets,
  height: number,
  view: View,
): TourLayout => {
  const { equation, control, plane, qCard, curve } = targets
  const holes = (...rects: (Rect | null)[]) => rects.filter((r) => r !== null).map(pad)
  switch (step) {
    // 1 · The equation and the curve with P; the card right of the equation.
    case 1:
      return {
        holes: holes(equation, curve),
        card: equation === null ? null : beside(equation, 24, 0, height, view),
        hand: null,
      }
    // 2 · k's control, with room under its tape for the drag path; the card
    // right of it, a little higher; the hand on the ruler.
    case 2:
      return control === null
        ? { holes: [], card: null, hand: null }
        : {
            holes: holes({ ...control, h: control.h + 12 }),
            card: beside(control, 28, -20, height, view),
            hand: { x: control.x + 46, y: control.y + control.h - 34 },
          }
    // 3 · The whole plane and Q's card; the card low on the plane, caret up.
    case 3: {
      if (plane === null) {
        return { holes: holes(qCard), card: null, hand: null }
      }
      const { width, caret } = TOUR_CARD
      const x = clamp(plane.x + 60, MARGIN, view.width - MARGIN - width)
      const y = clamp(plane.y + 470 + caret, MARGIN + caret, view.height - MARGIN - height)
      return { holes: holes(plane, qCard), card: { x, y, caret: { side: "top", at: 9 } }, hand: null }
    }
  }
}
