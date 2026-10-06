import type { FvState } from "./state.ts"

import { BASE_FUNCTIONS } from "../math/baseFunctions.ts"
import { evaluate, isAtDefault, TRANSFORM_PARAMS } from "../math/form.ts"

/** The transformed curve at x: a · g((x − h) / b) + k. */
export const curveAt = (state: Pick<FvState, "fn" | "params">, x: number): number =>
  evaluate(BASE_FUNCTIONS[state.fn].g, state.params, x)

/** Any of a, b, h, k off its default. */
export const isTransformed = (state: FvState): boolean =>
  TRANSFORM_PARAMS.some((param) => !isAtDefault(state.params, param))

/** Decision D7: the dashed original shows while its toggle is on and a transform is set. */
export const ghostVisible = (state: FvState): boolean => state.ghostOn && isTransformed(state)
