import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react"

import type { FvExplainBy } from "../model/state.ts"

import { EXPLAINER_REST_MS } from "./explainer.ts"

// A control's letter chip opens its parameter's explainer (decision D12):
// the pointer resting on it 400 ms, a click (a tap toggles), or ? while the
// control has the focus. Gives the chip's handlers and the control's key
// handler; the view decides what closes it. Today's rulers and the C3 rows
// share it.
export function useChipExplainer(
  onExplain: ((by: FvExplainBy, open: boolean | "toggle") => void) | undefined,
) {
  // The chip's rest timer, and the kind of pointer that last pressed it:
  // a touch tap toggles, where a mouse click opens at once.
  const restTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressedBy = useRef<string>("mouse")
  const stopRest = () => {
    if (restTimer.current !== null) {
      clearTimeout(restTimer.current)
      restTimer.current = null
    }
  }
  useEffect(
    () => () => {
      if (restTimer.current !== null) {
        clearTimeout(restTimer.current)
      }
    },
    [],
  )
  return {
    chip: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch" && onExplain !== undefined) {
          stopRest()
          restTimer.current = setTimeout(() => onExplain("hover", true), EXPLAINER_REST_MS)
        }
      },
      onPointerLeave: (event: PointerEvent<HTMLElement>) => {
        stopRest()
        if (event.pointerType !== "touch") {
          onExplain?.("hover", false)
        }
      },
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        pressedBy.current = event.pointerType
      },
      onClick: () => {
        stopRest()
        if (pressedBy.current === "touch") {
          onExplain?.("tap", "toggle")
        } else {
          onExplain?.("hover", true)
        }
      },
    },
    /** The control hears ? from whichever of its parts has the focus, not while a value is typed. */
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "?" && !(event.target instanceof HTMLInputElement) && onExplain !== undefined) {
        event.preventDefault()
        onExplain("key", "toggle")
      }
    },
  }
}
