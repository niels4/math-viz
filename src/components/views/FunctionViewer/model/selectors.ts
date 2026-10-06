import type { NumberFieldEdit } from "#src/components/ui/NumberField.tsx"
import type { ScrubMode } from "#src/components/ui/scrub.ts"

import type { FvPart, FvState } from "./state.ts"

import { BASE_FUNCTIONS } from "../math/baseFunctions.ts"
import { evaluate, isIdentity } from "../math/form.ts"

/** The transformed curve at x: a · g((x − h) / b) + k. */
export const curveAt = (state: Pick<FvState, "fn" | "params">, x: number): number =>
  evaluate(BASE_FUNCTIONS[state.fn].g, state.params, x)

/** Any of a, b, h, k off its default. */
export const isTransformed = (state: FvState): boolean => !isIdentity(state.params)

/** Decision D7: the dashed original shows while its toggle is on and a transform is set. */
export const ghostVisible = (state: FvState): boolean => state.ghostOn && isTransformed(state)

/** What a part draws of its own state: the pointer on it, its drag's mode, its open edit. */
export type PartUi = { hovered: boolean; mode: ScrubMode | null; edit: NumberFieldEdit | null }

export const partUi = (state: FvState, part: FvPart): PartUi => ({
  hovered: state.hover === part,
  mode: state.drag?.part === part ? state.drag.mode : null,
  edit: state.edit?.part === part ? { error: state.edit.error, base: state.edit.base } : null,
})

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
