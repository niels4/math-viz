import { useAtomValue } from "jotai"
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { selectNothingUntilRelease } from "#src/util/pointer/selectNothing.ts"

import { transformParams } from "../../queryParams"
import { highlightAtoms, type TransformParam } from "../../state"
import { nudged, scrubbed, scrubMode, shown, wheelDx, type ScrubMode } from "./scrub.ts"
import style from "./ScrubValue.module.css"

// How far in px a press moves before it drags. A press that moves less is a
// click, which opens the box for typing, so a shaky click doesn't nudge the
// value.
const DRAG_THRESHOLD = 3

// A mouse resting this long on the box counts as asking how it works, and
// the box answers with its tip, word by word so it wraps like prose.
const REST_MS = 400
const tipWords = (defaultValue: number) =>
  `Drag sideways · Shift for fine · double-click: back to ${defaultValue}`.split(" ")

type Press = {
  pointerId: number
  // Where the drag's current stretch began and the value there. Pressing or
  // letting go of Shift, Ctrl or ⌘ mid-drag starts a new stretch where the
  // pointer is, so the new speed applies from there and the value doesn't
  // jump.
  x: number
  from: number
  lastX: number
  mode: ScrubMode
  // The value the drag set last.
  value: number
  // Whether the press has moved far enough to drag.
  dragging: boolean
}

// A transform parameter's value in a box between ‹ and ›. Drag the box
// sideways to change the value, right for more, holding Shift for fine or
// Ctrl or ⌘ to snap; the wheel does the same. Click the box to type a
// value, and ↑ ↓ nudge it by 0.01, or 0.1 with Shift. Double-click it to
// put back the default. While a drag holds the value, a ruler shows under
// the row. `id` lets the row's label name the box.
export const ScrubValue = ({ id, param }: { id: string; param: TransformParam }) => {
  const isScale = param === "a" || param === "b"
  const urlParam = transformParams[param]
  const [value, setValue, flushValue] = useQueryParam(urlParam)
  const lit = useAtomValue(highlightAtoms[param])
  // The text in the box while you type. Partial numbers such as "-" or "1."
  // stay here, and Enter or leaving the box sets the value. Text the URL
  // wouldn't accept either, such as a scale of 0, puts the old value back.
  const [draft, setDraft] = useState<string | null>(null)
  // The mode of the drag in progress, which sets the decimals it shows.
  const [mode, setMode] = useState<ScrubMode | null>(null)
  // Whether a mouse is on the box, and whether it has rested there. A press
  // ends the rest until the pointer comes back.
  const [pointerOn, setPointerOn] = useState(false)
  const [resting, setResting] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLInputElement>(null)
  const press = useRef<Press | null>(null)
  const typing = () => document.activeElement === fieldRef.current

  const commit = () => {
    if (draft === null) {
      return
    }
    const next = urlParam.parse(draft)
    if (next !== undefined) {
      setValue(next, { flush: true })
    }
    setDraft(null)
  }

  const send = (p: Press, next: number) => {
    if (next !== p.value) {
      p.value = next
      setValue(next)
    }
  }

  // Snap takes hold at once; fine and coarse wait for the next move, so
  // letting go of Shift leaves the value where it is.
  const changeMode = (p: Press, next: ScrubMode) => {
    p.x = p.lastX
    p.from = p.value
    p.mode = next
    setMode(next)
    if (next === "snap") {
      send(p, scrubbed(p.from, 0, isScale, next))
    }
  }

  const drag = (e: PointerEvent) => {
    const p = press.current
    if (p === null || e.pointerId !== p.pointerId) {
      return
    }
    if (!p.dragging) {
      if (Math.abs(e.clientX - p.x) < DRAG_THRESHOLD) {
        return
      }
      p.dragging = true
      p.mode = scrubMode(e)
      setMode(p.mode)
    } else if (scrubMode(e) !== p.mode) {
      changeMode(p, scrubMode(e))
    }
    p.lastX = e.clientX
    send(p, scrubbed(p.from, e.clientX - p.x, isScale, p.mode))
  }

  // Ends the press. The URL takes a drag's value as it ends.
  const stop = () => {
    const p = press.current
    press.current = null
    if (p?.dragging === true) {
      setMode(null)
      flushValue()
    }
    return p
  }

  // Shift, Ctrl or ⌘ pressed or let go while the pointer holds still. A
  // release outside the box or the window losing focus ends the drag.
  const onWindowKey = useEffectEvent((e: KeyboardEvent) => {
    const p = press.current
    if (p?.dragging === true && scrubMode(e) !== p.mode) {
      changeMode(p, scrubMode(e))
    }
  })
  const onWindowRelease = useEffectEvent(() => {
    stop()
  })
  useEffect(() => {
    const key = (e: KeyboardEvent) => onWindowKey(e)
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

  // Each notch starts from the value the last one set, even before React
  // renders again. While you type, the wheel scrolls the page as usual.
  const onWheel = useEffectEvent((e: WheelEvent) => {
    if (typing()) {
      return
    }
    e.preventDefault()
    const notchMode = scrubMode(e)
    setValue((prev) => scrubbed(prev, wheelDx(e), isScale, notchMode))
  })
  // React's wheel listener is passive and can't stop the page scrolling, so
  // the box listens itself.
  useEffect(() => {
    const box = boxRef.current
    if (box === null) {
      return
    }
    const wheel = (e: WheelEvent) => onWheel(e)
    box.addEventListener("wheel", wheel, { passive: false })
    return () => box.removeEventListener("wheel", wheel)
  }, [])

  useEffect(() => {
    if (!pointerOn) {
      return
    }
    const timer = setTimeout(() => setResting(true), REST_MS)
    return () => clearTimeout(timer)
  }, [pointerOn])

  const endRest = () => {
    setPointerOn(false)
    setResting(false)
  }

  return (
    <>
      <div
        ref={boxRef}
        className={style.box}
        data-lit={lit ? "" : undefined}
        onPointerEnter={(e) => {
          // A finger can't rest on the box without pressing it.
          if (e.pointerType !== "touch") {
            setPointerOn(true)
          }
        }}
        onPointerLeave={endRest}
        onPointerDown={(e) => {
          endRest()
          // While you type, a press belongs to the text.
          if (e.button !== 0 || typing()) {
            return
          }
          press.current = {
            pointerId: e.pointerId,
            x: e.clientX,
            from: value,
            lastX: e.clientX,
            mode: "coarse",
            value,
            dragging: false,
          }
          selectNothingUntilRelease(e)
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            // Synthetic events in tests use arbitrary pointerIds that were
            // never captured, and some browsers throw for those. The drag
            // still works without capture in that case.
          }
        }}
        onPointerMove={(e) => {
          // A move with no button held means the release went missing.
          if (e.buttons === 0) {
            stop()
          } else {
            drag(e)
          }
        }}
        onPointerUp={(e) => {
          if (press.current?.pointerId !== e.pointerId) {
            return
          }
          // A pointer can let go somewhere it never sent a move from.
          drag(e)
          // A click opens the box with its value selected, ready to type over.
          if (stop()?.dragging === false) {
            fieldRef.current?.focus()
            fieldRef.current?.select()
          }
        }}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        onDoubleClick={() => {
          // A double-click puts back the default, whatever the first click
          // opened. Leaving the box first ends any typing, so the typed text
          // can't land after the default.
          fieldRef.current?.blur()
          setValue(urlParam.defaultValue, { flush: true })
        }}
      >
        <Chevron dir="left" />
        <input
          ref={fieldRef}
          id={id}
          type="text"
          className={style.field}
          value={draft ?? shown(value, mode === "fine")}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit()
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault()
              // From the text typed so far, if the URL would take it.
              const from = (draft === null ? undefined : urlParam.parse(draft)) ?? value
              const delta = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 0.1 : 0.01)
              setValue(nudged(from, isScale, delta))
              setDraft(null)
            }
          }}
          onBlur={commit}
        />
        <Chevron dir="right" />
        {/* Seen, not heard: it repeats the gestures for the pointer. */}
        {resting && (
          <div className={style.tip} aria-hidden="true">
            {tipWords(urlParam.defaultValue).map((word, i) => (
              <span key={i}>{word}</span>
            ))}
          </div>
        )}
      </div>
      {/* A sibling of the box, so the row places it: under the row and as
        wide, over what lies below so nothing moves. Seen, not heard: the
        field reads the value. */}
      {mode !== null && (
        <div className={style.ruler} aria-hidden="true">
          <div className={style.tape} />
        </div>
      )}
    </>
  )
}

// ‹ or › beside the value, in the parameter's colour. Hidden from screen
// readers, for whom they say nothing.
const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg className={style.chevron} width="6" height="12" viewBox="0 0 6 12" aria-hidden="true">
    <path d={dir === "left" ? "M5 2L1 6L5 10" : "M1 2L5 6L1 10"} />
  </svg>
)
