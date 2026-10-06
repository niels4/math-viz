import { useEffect, useState } from "react"

/** An overlay's presence: open, closing (on its way out), or gone. */
export type Presence = "open" | "closing" | "closed"

// Keeps an overlay mounted through its exit, so it can animate out: open
// while `open`, closing for `exitMs` after it closes, then closed. With no
// exit time it closes at once. Reopening mid-exit opens it again.
export const usePresence = (open: boolean, exitMs: number): Presence => {
  const [was, setWas] = useState(open)
  const [closing, setClosing] = useState(false)
  if (was !== open) {
    setWas(open)
    setClosing(!open && exitMs > 0)
  }
  useEffect(() => {
    if (!closing) {
      return
    }
    const timer = setTimeout(() => setClosing(false), exitMs)
    return () => clearTimeout(timer)
  }, [closing, exitMs])
  return open ? "open" : closing ? "closing" : "closed"
}

/**
 * A value that goes away (an open explainer's parameter, the tour's step),
 * kept through its exit, so its overlay can animate out: the value while
 * it is there, the last one while it leaves (`closing`), null once gone.
 * A primitive, compared by value.
 */
export const useLeaving = <T extends string | number>(
  value: T | null,
  exitMs: number,
): { shown: T | null; closing: boolean } => {
  const presence = usePresence(value !== null, exitMs)
  const [last, setLast] = useState(value)
  if (value !== null && value !== last) {
    setLast(value)
  }
  const closing = presence === "closing"
  return { shown: value ?? (closing ? last : null), closing }
}
