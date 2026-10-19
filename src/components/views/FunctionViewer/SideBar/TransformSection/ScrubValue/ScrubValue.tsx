import { useAtomValue } from "jotai"
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { selectNothingUntilRelease } from "#src/util/pointer/selectNothing.ts"

import { transformParams } from "../../../queryParams.ts"
import { highlightAtoms, type TransformParam } from "../../../state.ts"
import { Ruler } from "./Ruler.tsx"
import { nudged, scrubbed, scrubMode, shown, wheelDx, type ScrubMode } from "./scrub.ts"
import style from "./ScrubValue.module.css"

const DRAG_THRESHOLD = 3

const REST_MS = 400
const tipWords = (defaultValue: number) =>
  `Drag sideways · Shift for fine · double-click: back to ${defaultValue}`.split(" ")

type Press = {
  pointerId: number
  x: number
  from: number
  lastX: number
  mode: ScrubMode
  value: number
  dragging: boolean
}

export const ScrubValue = ({ id, param }: { id: string; param: TransformParam }) => {
  const isScale = param === "a" || param === "b"
  const urlParam = transformParams[param]
  const [value, setValue, flushValue] = useQueryParam(urlParam)
  const lit = useAtomValue(highlightAtoms[param])
  const [draft, setDraft] = useState<string | null>(null)
  const [typingFrom, setTypingFrom] = useState<number | null>(null)
  const [mode, setMode] = useState<ScrubMode | null>(null)
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

  const stop = () => {
    const p = press.current
    press.current = null
    if (p?.dragging === true) {
      setMode(null)
      flushValue()
    }
    return p
  }

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

  const onWheel = useEffectEvent((e: WheelEvent) => {
    if (typing()) {
      return
    }
    e.preventDefault()
    const notchMode = scrubMode(e)
    setValue((prev) => scrubbed(prev, wheelDx(e), isScale, notchMode))
  })
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
        data-mode={mode ?? undefined}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") {
            setPointerOn(true)
          }
        }}
        onPointerLeave={endRest}
        onPointerDown={(e) => {
          endRest()
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
          } catch {}
        }}
        onPointerMove={(e) => {
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
          drag(e)
          if (stop()?.dragging === false) {
            fieldRef.current?.focus()
            fieldRef.current?.select()
          }
        }}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        onDoubleClick={() => {
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
              const from = (draft === null ? undefined : urlParam.parse(draft)) ?? value
              const delta = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 0.1 : 0.01)
              setValue(nudged(from, isScale, delta))
              setDraft(null)
            } else if (e.key === "Escape" && typingFrom !== null) {
              e.currentTarget.blur()
              setValue(typingFrom, { flush: true })
            }
          }}
          onFocus={() => setTypingFrom(value)}
          onBlur={() => {
            commit()
            setTypingFrom(null)
          }}
        />
        <Chevron dir="right" />
        {typingFrom !== null ? (
          <div className={style.tip} aria-hidden="true">
            <kbd className={style.key}>Enter</kbd>
            <span>apply ·</span>
            <kbd className={style.key}>Esc</kbd>
            <span>cancel ·</span>
            <kbd className={style.key}>
              <Arrow dir="up" />
            </kbd>
            <kbd className={style.key}>
              <Arrow dir="down" />
            </kbd>
            <span>nudge 0.01</span>
          </div>
        ) : (
          resting && (
            <div className={style.tip} aria-hidden="true">
              {tipWords(urlParam.defaultValue).map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </div>
          )
        )}
      </div>
      {mode !== null && <Ruler value={value} isScale={isScale} mode={mode} />}
    </>
  )
}

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg className={style.chevron} width="6" height="12" viewBox="0 0 6 12" aria-hidden="true">
    <path d={dir === "left" ? "M5 2L1 6L5 10" : "M1 2L5 6L1 10"} />
  </svg>
)

const Arrow = ({ dir }: { dir: "up" | "down" }) => (
  <svg className={style.arrow} width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
    <path d={dir === "up" ? "M4 8L9 2L14 8M9 2V14" : "M4 8L9 14L14 8M9 14V2"} />
  </svg>
)
