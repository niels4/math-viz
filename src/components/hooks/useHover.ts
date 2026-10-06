import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react"

// Whether the pointer is over an element, reported to `onChange` as it
// changes. Enter and leave events alone can stick: Chromium sends no
// pointerout from an input whose text changed under the pointer (a typed
// "-2" printed back as "−2"), so React never fires its leave. While
// hovered, any pointerover outside the element also ends it.
export const useHover = (ref: RefObject<HTMLElement | null>, onChange?: (hovered: boolean) => void) => {
  const [hovered, setHovered] = useState(false)
  // What was last reported: a leave and a pointerover elsewhere can both end one hover.
  const reported = useRef(false)

  const set = (next: boolean) => {
    if (reported.current === next) {
      return
    }
    reported.current = next
    setHovered(next)
    onChange?.(next)
  }

  const onPointerOver = useEffectEvent((event: PointerEvent) => {
    const el = ref.current
    if (el !== null && event.target instanceof Node && !el.contains(event.target)) {
      set(false)
    }
  })

  useEffect(() => {
    if (!hovered) {
      return
    }
    const over = (event: PointerEvent) => onPointerOver(event)
    document.addEventListener("pointerover", over)
    return () => {
      document.removeEventListener("pointerover", over)
    }
  }, [hovered])

  return {
    hovered,
    onPointerEnter: () => set(true),
    onPointerLeave: () => set(false),
  }
}
