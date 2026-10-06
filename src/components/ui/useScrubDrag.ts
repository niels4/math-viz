import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from "react"

import { scrubDelta, scrubMode, type ScrubKind, type ScrubMode } from "./scrub.ts"

type Drag = {
  /** Where the drag's current stretch began and the value there: a modifier change starts a new stretch. */
  anchorX: number
  anchorValue: number
  lastX: number
  mode: ScrubMode
  /** The value last sent. */
  value: number
}

export type ScrubDragHandlers = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onLostPointerCapture: () => void
}

// Pointer dragging for the jog ruler and anything scrubbed like it (the
// equation's terms, D13): right for more, measured from the press at the
// ruler's rates (scrub.ts). Shift and Ctrl/⌘ may change mid-drag: the new
// rate applies from where the pointer is, so letting go of Shift never moves
// the value, and Ctrl snaps it at once. Letting go anywhere, a lost capture
// or a lost window focus ends the drag, and a move with no button held
// drops a drag whose release was missed (AGENTS.md › pointer-capture drags).
export function useScrubDrag({
  value,
  kind,
  onChange,
  onModeChange,
}: {
  value: number
  kind: ScrubKind
  onChange: (next: number) => void
  /** The drag's mode as it starts and changes, null when it ends. */
  onModeChange?: (mode: ScrubMode | null) => void
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
    if (dragRef.current !== null) {
      dragRef.current = null
      showMode(null)
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return
    }
    const next = scrubMode(event)
    const drag: Drag = { anchorX: event.clientX, anchorValue: value, lastX: event.clientX, mode: next, value }
    dragRef.current = drag
    event.currentTarget.setPointerCapture(event.pointerId)
    showMode(next)
    if (next === "snap") {
      send(drag, scrubDelta({ value, dxPx: 0, kind, mode: next }))
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
    if (drag === null) {
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
      onPointerUp: stop,
      onPointerCancel: stop,
      onLostPointerCapture: stop,
    },
  }
}
