import type { Hint } from "#src/components/ui/HintBar.tsx"

import { formatStored } from "#src/util/format/number.ts"

import type { FvPart, FvState } from "./state.ts"

import { HINTS } from "../copy.ts"
import { DEFAULT_PARAMS, isScale, type TransformParam } from "../math/form.ts"

export type HintContext =
  | { kind: "idle" }
  | { kind: "transform"; param: TransformParam }
  | { kind: "fine" }
  | { kind: "snap" }
  | { kind: "edit" }
  | { kind: "error"; error: string; base: number }
  | { kind: "plane" }
  | { kind: "point" }

const partContext = (part: FvPart | null): HintContext =>
  part === null
    ? { kind: "idle" }
    : part === "p"
      ? { kind: "point" }
      : part === "plane"
        ? { kind: "plane" }
        : { kind: "transform", param: part }

// What the hint line speaks about (FV 01 › Hint contexts; decision D8). An
// open value field comes first: its refusal, or the typing keys. Then a
// drag: its held modifier, or the part dragged. Then the part the pointer
// or the focus is on, whichever moved last, else the other; idle when
// neither is on a part.
export const hintContext = (state: FvState): HintContext => {
  const { edit, drag } = state
  if (edit !== null) {
    return edit.error === null ? { kind: "edit" } : { kind: "error", error: edit.error, base: edit.base }
  }
  if (drag !== null) {
    return drag.mode === "coarse" ? partContext(drag.part) : { kind: drag.mode }
  }
  const [first, second] = state.lead === "focus" ? [state.focus, state.hover] : [state.hover, state.focus]
  return partContext(first ?? second)
}

export const hintFor = (context: HintContext): Hint => {
  switch (context.kind) {
    case "transform":
      return {
        phrases: HINTS.transform(context.param, isScale(context.param), DEFAULT_PARAMS[context.param]),
      }
    case "error":
      return { phrases: HINTS.refused(context.error, formatStored(context.base)), tone: "error" }
    default:
      return { phrases: HINTS[context.kind] }
  }
}
