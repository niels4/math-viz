import type { NumberFieldEdit } from "#src/components/ui/NumberField.tsx"
import type { ScrubMode } from "#src/components/ui/scrub.ts"

import { storedDp } from "#src/util/format/number.ts"

import { BASE_FUNCTIONS } from "../math/baseFunctions.ts"
import {
  evaluate,
  isIdentity,
  TRANSFORM_PARAMS,
  type TransformParam,
  type TransformParams,
} from "../math/form.ts"
import { HANDLE_PARAMS, type FvHandle, type FvPart, type FvState } from "./state.ts"

/** The transformed curve at x: a · g((x − h) / b) + k. */
export const curveAt = (state: Pick<FvState, "fn" | "params">, x: number): number =>
  evaluate(BASE_FUNCTIONS[state.fn].g, state.params, x)

/** Any of a, b, h, k off its default. */
export const isTransformed = (state: Pick<FvState, "params">): boolean => !isIdentity(state.params)

/** Decision D7: the dashed original shows while its toggle is on and a transform is set. */
export const ghostVisible = (state: Pick<FvState, "ghostOn" | "params">): boolean =>
  state.ghostOn && isTransformed(state)

/**
 * P's partners light together (FV 04 › Y1): while P's card is hovered or
 * focused, P is dragged, or the pointer is on P's marker, P's marker takes
 * its halo and drops lines to both axes.
 */
export const pLit = (state: FvState): boolean =>
  state.hover === "p" ||
  state.focus === "p" ||
  state.drag?.part === "p" ||
  (state.hover === "plane" && state.planeOver === "p")

/**
 * The value that lights its partners (FV 04 › Partner map): a parameter,
 * from its control or its term, or a handle, which drives two. One at a
 * time, in the hint's precedence: an open field (unless its text is
 * refused), then a drag, then an open explainer (R7: its terms light),
 * then the part the pointer or the focus is on, whichever moved last, else
 * the other.
 */
export type FvActive = TransformParam | FvHandle | null

const isParam = (part: FvPart): part is TransformParam =>
  (TRANSFORM_PARAMS as readonly FvPart[]).includes(part)

const isHandle = (value: FvPart | FvActive): value is FvHandle => value === "anchor" || value === "stretch"

const activeOf = (state: FvState, part: FvPart | null): FvActive => {
  if (part === null) {
    return null
  }
  if (isParam(part) || isHandle(part)) {
    return part
  }
  if (part === "eq") {
    return state.eqOver
  }
  if (part === "plane" && isHandle(state.planeOver)) {
    return state.planeOver
  }
  return null
}

export const active = (state: FvState): FvActive => {
  const { edit, drag } = state
  if (edit !== null) {
    return edit.error === null ? activeOf(state, edit.part) : null
  }
  if (drag !== null) {
    return activeOf(state, drag.part)
  }
  if (state.explainer !== null) {
    return state.explainer.param
  }
  const [first, second] = state.lead === "focus" ? [state.focus, state.hover] : [state.hover, state.focus]
  return activeOf(state, first ?? second)
}

/** The parameters lit together: the active one, or both of an active handle. */
export const activeParams = (state: FvState): readonly TransformParam[] => {
  const a = active(state)
  return a === null ? [] : isHandle(a) ? HANDLE_PARAMS[a] : [a]
}

/** The parameters a part's drag changes: a ruler's or a term's one, a handle's two. */
export const paramsOf = (part: FvPart): readonly TransformParam[] =>
  isParam(part) ? [part] : isHandle(part) ? HANDLE_PARAMS[part] : []

/** The parameters a drag is changing: their live terms stay put. */
export const draggedParams = (state: FvState): readonly TransformParam[] =>
  state.drag === null ? [] : paramsOf(state.drag.part)

const NONE_HELD: readonly TransformParam[] = []

/** The values a drag holds at 3 decimals (FvDrag › fine): every place that prints them holds them too. */
export const fineParams = (state: FvState): readonly TransformParam[] => state.drag?.fine ?? NONE_HELD

/**
 * The decimals each value prints at (number.ts › storedDp): its stored
 * value's, 3 while a drag holds it fine. The plane's frames print a
 * springing value (FV 05's jumps) at the decimals of where it lands, so a
 * plate's decimal point holds still while the value springs.
 */
export const valueDecimals = (
  params: TransformParams,
  fine: readonly TransformParam[],
): Readonly<Record<TransformParam, number>> => ({
  a: storedDp(params.a, fine.includes("a")),
  b: storedDp(params.b, fine.includes("b")),
  h: storedDp(params.h, fine.includes("h")),
  k: storedDp(params.k, fine.includes("k")),
})

/**
 * What a part draws of its own state: the pointer on it, lit as a partner
 * of the active value, its drag's mode (a handle's drag holds both its
 * parameters, coarse), its value held at 3 decimals by a drag, its open edit.
 */
export type PartUi = {
  hovered: boolean
  lit: boolean
  mode: ScrubMode | null
  fine: boolean
  edit: NumberFieldEdit | null
}

export const partUi = (state: FvState, part: FvPart): PartUi => {
  const { drag } = state
  const heldByHandle =
    drag !== null && isHandle(drag.part) && isParam(part) && HANDLE_PARAMS[drag.part].includes(part)
  return {
    hovered: state.hover === part,
    lit: isParam(part) && activeParams(state).includes(part),
    mode: drag?.part === part ? drag.mode : heldByHandle ? "coarse" : null,
    fine: isParam(part) && fineParams(state).includes(part),
    edit: state.edit?.part === part ? { error: state.edit.error, base: state.edit.base } : null,
  }
}

/** The handle with its grab halo: the one dragged, else the one under the pointer. */
export const handleLit = (state: FvState): FvHandle | null =>
  state.drag !== null
    ? isHandle(state.drag.part)
      ? state.drag.part
      : null
    : state.hover === "plane" && isHandle(state.planeOver)
      ? state.planeOver
      : null

/** The handle being dragged: filled with its ink. */
export const handleHeld = (state: FvState): FvHandle | null =>
  state.drag !== null && isHandle(state.drag.part) ? state.drag.part : null

/**
 * How far a transform's drag has moved P (FV 04: "moved +1"), once it has;
 * null otherwise. P keeps its x (D15), so this is f(P) now less f(P) then.
 */
export const pMoved = (state: FvState): number | null =>
  state.pBefore === null || !state.pBefore.moved || state.pBefore.x !== state.pX
    ? null
    : curveAt(state, state.pX) - state.pBefore.y

/**
 * Where f(P) lies against the plane's visible y-range: above or below it
 * (the ▲ ▼ note on P's card, FV 01 › Ranges), or null inside it and before
 * the plane's first layout.
 */
export const pOffView = (state: FvState): "above" | "below" | null => {
  if (state.view === null) {
    return null
  }
  const y = curveAt(state, state.pX)
  return y > state.view.extent.maxY ? "above" : y < state.view.extent.minY ? "below" : null
}
