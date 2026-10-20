import { useAtomValue } from "jotai"
import { useEffect, useState } from "react"

import { transformDragAtom } from "../../state.ts"

const LINGER_MS = 600

type Before = { x: number; y: number; moved: boolean }

export const useMovedBy = (x: number, y: number): number | null => {
  const dragging = useAtomValue(transformDragAtom)
  const [seen, setSeen] = useState({ dragging, x, y })
  const [before, setBefore] = useState<Before | null>(null)

  if (seen.dragging !== dragging || seen.x !== x || seen.y !== y) {
    setSeen({ dragging, x, y })
    // A drag's first change can land in the same render as its start, so P's start is the last render's.
    let next = dragging && !seen.dragging ? { x: seen.x, y: seen.y, moved: false } : before
    if (next !== null) {
      if (x !== next.x || (!dragging && y !== seen.y)) {
        next = null
      } else if (dragging && !next.moved && Math.abs(y - next.y) > 1e-9) {
        next = { ...next, moved: true }
      }
    }
    if (next !== before) {
      setBefore(next)
    }
  }

  const lingering = !dragging && before !== null
  useEffect(() => {
    if (!lingering) {
      return
    }
    const timer = setTimeout(() => setBefore(null), LINGER_MS)
    return () => clearTimeout(timer)
  }, [lingering])

  return before?.moved === true ? y - before.y : null
}
