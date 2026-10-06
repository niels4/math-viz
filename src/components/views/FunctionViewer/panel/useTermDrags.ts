import type { HTMLAttributes } from "react"

import type { ScrubMode } from "#src/components/ui/scrub.ts"

import { useScrubDrag } from "#src/components/ui/useScrubDrag.ts"

import type { TransformParam, TransformParams } from "../math/form.ts"

import { isScale } from "../math/form.ts"

// The equation's terms drag like their rulers (decision D13): right for
// more at the ruler's rates (ui/scrub.ts), Shift fine, Ctrl snaps, a
// double-click resets. One jog drag per parameter, shared by its term in
// the live line and its slot in the form line.
export function useTermDrags({
  params,
  onChange,
  onDrag,
  onReset,
}: {
  params: TransformParams
  onChange: (param: TransformParam, value: number) => void
  /** A term's drag starts, changes mode, or ends (null). */
  onDrag: (param: TransformParam, mode: ScrubMode | null) => void
  onReset: (param: TransformParam) => void
}): (param: TransformParam) => HTMLAttributes<HTMLSpanElement> {
  const drag = (param: TransformParam) => ({
    value: params[param],
    kind: isScale(param) ? ("multiplicative" as const) : ("additive" as const),
    onChange: (value: number) => onChange(param, value),
    onModeChange: (mode: ScrubMode | null) => onDrag(param, mode),
  })
  const drags = {
    a: useScrubDrag(drag("a")),
    b: useScrubDrag(drag("b")),
    h: useScrubDrag(drag("h")),
    k: useScrubDrag(drag("k")),
  }
  return (param) => ({ ...drags[param].handlers, onDoubleClick: () => onReset(param) })
}
