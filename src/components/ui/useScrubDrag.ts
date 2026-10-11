import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from "react"

import { selectNothingUntilRelease } from "#src/util/pointer/selectNothing.ts"

import { scrubDelta, scrubMode, type ScrubKind, type ScrubMode } from "./scrub.ts"

type Drag = {
  /** Where the drag's current stretch began and the value there: a modifier change starts a new stretch. */
  anchorX: number
  anchorValue: number
  lastX: number
  mode: ScrubMode
  /** The value last sent. */
  value: number
  /** Pressed, not yet moved past the threshold: no drag shown, a release is a tap. */
  pending: boolean
}

export type ScrubDragHandlers = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onLostPointerCapture: () => void
}

// Pointer dragging for the jog ruler and anything scrubbed like it (the
// equation's terms, D13; a number box): right for more, measured from the
// press at the ruler's rates (scrub.ts). Shift and Ctrl/⌘ may change
// mid-drag: the new rate applies from where the pointer is, so letting go
// of Shift never moves the value, and Ctrl snaps it at once. Letting go
// anywhere, a lost capture or a lost window focus ends the drag, and a move
// with no button held drops a drag whose release was missed (AGENTS.md ›
// pointer-capture drags). A drag selects no text, wherever the pointer goes.
// With a threshold, a press becomes a drag only once the pointer has
// travelled that far (measured from the press, so nothing jumps), and a
// press let go before that is a tap.
export function useScrubDrag({
  value,
  kind,
  onChange,
  onModeChange,
  threshold = 0,
  onTap,
}: {
  value: number
  kind: ScrubKind
  onChange: (next: number) => void
  /** The drag's mode as it starts and changes, null when it ends. */
  onModeChange?: (mode: ScrubMode | null) => void
  /** How far in px a press travels before it drags; 0 drags from the press. */
  threshold?: number
  /** A press let go before it dragged (with a threshold). */
  onTap?: () => void
}): { mode: ScrubMode | null; handlers: ScrubDragHandlers } {
  const dragRef = useRef<Drag | null>(null)
  const [mode, setMode] = useState<ScrubMode | null>(null)

  const showMode = (next: ScrubMode | null) => {
    setMode(next)
    onModeChange?.(next)
  }

  const send = (drag: Drag, next: number) => {
    if (next !== drag.value) {
      drag.value = next
      onChange(next)
    }
  }

  const changeMode = (drag: Drag, next: ScrubMode) => {
    drag.anchorX = drag.lastX
    drag.anchorValue = drag.value
    drag.mode = next
    showMode(next)
    if (next === "snap") {
      send(drag, scrubDelta({ value: drag.value, dxPx: 0, kind, mode: next }))
    }
  }

  const stop = () => {
    const drag = dragRef.current
    if (drag !== null) {
      dragRef.current = null
      if (!drag.pending) {
        showMode(null)
      }
    }
  }

  // The drag shows from here: its mode, and a snap's value at once.
  const begin = (drag: Drag) => {
    drag.pending = false
    showMode(drag.mode)
    if (drag.mode === "snap") {
      send(drag, scrubDelta({ value: drag.anchorValue, dxPx: 0, kind, mode: drag.mode }))
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return
    }
    const drag: Drag = {
      anchorX: event.clientX,
      anchorValue: value,
      lastX: event.clientX,
      mode: scrubMode(event),
      value,
      pending: threshold > 0,
    }
    dragRef.current = drag
    event.currentTarget.setPointerCapture(event.pointerId)
    selectNothingUntilRelease(event)
    if (!drag.pending) {
      begin(drag)
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (drag === null) {
      return
    }
    if (event.buttons === 0) {
      stop()
      return
    }
    if (drag.pending) {
      if (Math.abs(event.clientX - drag.anchorX) < threshold) {
        return
      }
      drag.mode = scrubMode(event)
      begin(drag)
    }
    const next = scrubMode(event)
    if (next !== drag.mode) {
      changeMode(drag, next)
    }
    drag.lastX = event.clientX
    send(
      drag,
      scrubDelta({ value: drag.anchorValue, dxPx: event.clientX - drag.anchorX, kind, mode: drag.mode }),
    )
  }

  const onWindowKey = useEffectEvent((event: KeyboardEvent) => {
    const drag = dragRef.current
    if (drag === null || drag.pending) {
      return
    }
    const next = scrubMode(event)
    if (next !== drag.mode) {
      changeMode(drag, next)
    }
  })
  const onWindowRelease = useEffectEvent(() => {
    stop()
  })

  useEffect(() => {
    const key = (event: KeyboardEvent) => onWindowKey(event)
    const release = () => onWindowRelease()
    window.addEventListener("keydown", key)
    window.addEventListener("keyup", key)
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    window.addEventListener("blur", release)
    return () => {
      window.removeEventListener("keydown", key)
      window.removeEventListener("keyup", key)
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
      window.removeEventListener("blur", release)
    }
  }, [])

  return {
    mode,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: () => {
        const tapped = dragRef.current?.pending === true
        stop()
        if (tapped) {
          onTap?.()
        }
      },
      onPointerCancel: stop,
      onLostPointerCapture: stop,
    },
  }
}
