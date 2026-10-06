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
