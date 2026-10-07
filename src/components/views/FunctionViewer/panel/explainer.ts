import type { CalloutCaret } from "#src/components/ui/Callout.tsx"

import type { Rect } from "../../CartesianPlane/rect.ts"

// Decision D12 and where an explainer opens (help-popover-fv, FV 02 › H2;
// R7): right of the panel, over the plane's edge, never over the panel's
// own controls, its caret's tip on the letter chip's centre. A stacked
// window has no room right of the panel: there the card hangs under the
// chip, or above a chip low in the window, reaching away from the window's
// middle.

/** D12: the pointer resting this long on a letter chip opens its explainer. */
export const EXPLAINER_REST_MS = 400

/** The card is 300 wide; its caret 9 px, the tip 20 px below the card's top; 4 px right of the panel. */
export const EXPLAINER_LAYOUT = { width: 300, caret: 9, tip: 20, gap: 4 } as const

/** The card keeps this far inside the window. */
const MARGIN = 16

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(v, hi))

export type ExplainerPlace = { x: number; y: number; caret: CalloutCaret }

/**
 * The card's top-left (viewport px) and its caret, for a card `height` tall.
 * Kept 16 px inside the window, the caret following the chip. Where the
 * window has no room right of the panel (the stacked layout), it hangs
 * under the chip, its caret up, or where that runs out of the window,
 * stands above it, its caret down; failing both, on the roomier side.
 */
export const placeExplainer = (
  chip: Rect,
  panel: Rect,
  height: number,
  view: { width: number; height: number },
): ExplainerPlace => {
  const { width, caret, tip, gap } = EXPLAINER_LAYOUT
  const cx = chip.x + chip.w / 2
  const cy = chip.y + chip.h / 2
  const x = panel.x + panel.w + gap + caret
  if (x + width + MARGIN <= view.width) {
    const y = clamp(cy - tip, MARGIN, view.height - MARGIN - height)
    return { x, y, caret: { side: "left", at: clamp(cy - y, tip, height - tip) } }
  }
  const below = chip.y + chip.h + gap + caret
  const above = chip.y - gap - caret - height
  const roomBelow = view.height - MARGIN - (below + height)
  const roomAbove = above - MARGIN
  const under = roomBelow >= 0 || roomBelow >= roomAbove
  const outward = !under && cx < view.width / 2 ? cx + tip - width : cx - tip
  const left = clamp(outward, MARGIN, view.width - MARGIN - width)
  const at = clamp(cx - left, tip, width - tip)
  return under
    ? { x: left, y: below, caret: { side: "top", at } }
    : { x: left, y: above, caret: { side: "bottom", at } }
}
