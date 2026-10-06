import { useEffect, useEffectEvent, useState, type RefObject } from "react"

// Whether the pointer is over an element. Enter and leave events alone can
// stick: Chromium sends no pointerout from an input whose text changed under
// the pointer (a typed "-2" printed back as "−2"), so React never fires its
// leave. While hovered, any pointerover outside the element also ends it.
export const useHover = (ref: RefObject<HTMLElement | null>) => {
  const [hovered, setHovered] = useState(false)

  const onPointerOver = useEffectEvent((event: PointerEvent) => {
    const el = ref.current
    if (el !== null && event.target instanceof Node && !el.contains(event.target)) {
      setHovered(false)
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
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
  }
}
