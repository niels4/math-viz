import { useAtom, useAtomValue } from "jotai"
import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from "react"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useQueryParam } from "#src/components/router/queryParamAtom.ts"
import { selectNothingUntilRelease } from "#src/util/pointer/selectNothing.ts"

import { visibleRangeAtom } from "../../../CartesianPlane/state.ts"
import { pParam } from "../../queryParams.ts"
import { pDraggingAtom } from "../../state.ts"
import { formatNumber } from "./format.ts"
import { PointMark } from "./PointMark.tsx"
import style from "./PointSlider.module.css"

const QUANTUM = 0.01
const STEP = 0.1
const STEP_SHIFT = 1

const INSET = 9
const LINE_Y = 10
const ZERO_MARK = 10

const quantize = (v: number) =>
  Number((Math.sign(v) * Math.round(Math.abs(v) / QUANTUM) * QUANTUM).toPrecision(12)) || 0

const inward = (v: number, side: "low" | "high") =>
  quantize((side === "low" ? Math.ceil(v / QUANTUM - 1e-9) : Math.floor(v / QUANTUM + 1e-9)) * QUANTUM)

const px = (v: number) => Math.round(v * 100) / 100

export type PointSliderHandle = { focus: () => void }

export const PointSlider = ({
  ref,
  onEditRequest,
}: {
  ref?: Ref<PointSliderHandle>
  onEditRequest: () => void
}) => {
  const [value, setValue, flushValue] = useQueryParam(pParam)
  const range = useAtomValue(visibleRangeAtom)
  const minX = range?.minX ?? 0
  const maxX = range?.maxX ?? 0
  const trackRef = useRef<HTMLDivElement>(null)
  const { width } = useResizeObserver(trackRef)
  const [dragging, setDragging] = useAtom(pDraggingAtom)
  const pointerId = useRef<number | null>(null)
  useImperativeHandle(ref, () => ({ focus: () => trackRef.current?.focus() }), [])

  const span = maxX - minX
  const valid = Number.isFinite(span) && span > 0
  const low = inward(minX, "low")
  const high = inward(maxX, "high")
  const run = width - 2 * INSET

  const send = (next: number) => setValue(quantize(next))

  const sendFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (!valid || track === null) {
      return
    }
    const rect = track.getBoundingClientRect()
    if (rect.width <= 2 * INSET) {
      return
    }
    const t = Math.min(1, Math.max(0, (clientX - rect.left - INSET) / (rect.width - 2 * INSET)))
    send(Math.min(high, Math.max(low, minX + t * span)))
  }

  const stop = () => {
    if (pointerId.current === null) {
      return
    }
    pointerId.current = null
    setDragging(false)
    flushValue()
  }

  const onWindowRelease = useEffectEvent(() => {
    stop()
  })
  useEffect(() => {
    const release = () => onWindowRelease()
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    window.addEventListener("blur", release)
    return () => {
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
      window.removeEventListener("blur", release)
    }
  }, [])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault()
      const direction = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : -1
      send(value + direction * (e.shiftKey ? STEP_SHIFT : STEP))
    } else if ((e.key === "Home" || e.key === "End") && valid) {
      e.preventDefault()
      send(e.key === "Home" ? low : high)
    } else if (e.key === "Enter") {
      e.preventDefault()
      onEditRequest()
    }
  }

  const parked = !valid ? null : value < minX ? "left" : value > maxX ? "right" : null
  const thumbX =
    !valid || run <= 0
      ? null
      : parked === "left"
        ? INSET
        : parked === "right"
          ? width - INSET
          : INSET + ((value - minX) / span) * run
  const zeroX = valid && run > 0 && minX <= 0 && maxX >= 0 ? INSET + (-minX / span) * run : null

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="x of P"
      aria-valuemin={low}
      aria-valuemax={high}
      aria-valuenow={value}
      aria-valuetext={formatNumber(value)}
      className={style.track}
      data-dragging={dragging ? "" : undefined}
      data-parked={parked ?? undefined}
      onPointerDown={(e: PointerEvent) => {
        if (e.button !== 0 || !valid) {
          return
        }
        pointerId.current = e.pointerId
        setDragging(true)
        selectNothingUntilRelease(e)
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
        sendFromClientX(e.clientX)
      }}
      onPointerMove={(e) => {
        if (pointerId.current !== e.pointerId) {
          return
        }
        if (e.buttons === 0) {
          stop()
        } else {
          sendFromClientX(e.clientX)
        }
      }}
      onPointerUp={(e) => {
        if (pointerId.current === e.pointerId) {
          stop()
        }
      }}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={onKeyDown}
    >
      {run > 0 && (
        <svg className={style.marks} width={width} height={LINE_Y * 2} aria-hidden="true">
          <path className={style.line} d={`M${INSET} ${LINE_Y}H${px(width - INSET)}`} />
          {zeroX !== null && (
            <path
              className={style.zero}
              d={`M${px(zeroX)} ${LINE_Y - ZERO_MARK / 2}V${LINE_Y + ZERO_MARK / 2}`}
            />
          )}
        </svg>
      )}
      {thumbX !== null && (
        <>
          <span className={style.thumb} style={{ left: px(thumbX) }}>
            <PointMark parked={parked !== null} />
          </span>
          <span
            className={style.tip}
            style={{ "--x": `${px(thumbX)}px`, "--w": `${px(width)}px` } as CSSProperties}
            aria-hidden="true"
          >
            {parked === "left" && <Triangle dir="left" />}
            <var>x</var>
            <span className={style.tip_value}>= {formatNumber(value)}</span>
            {parked === "right" && <Triangle dir="right" />}
          </span>
        </>
      )}
    </div>
  )
}

const Triangle = ({ dir }: { dir: "left" | "right" }) => (
  <svg width="7" height="10" viewBox="0 0 7 10" fill="currentColor" aria-hidden="true">
    <path d={dir === "left" ? "M7 0L0 5L7 10Z" : "M0 0L7 5L0 10Z"} />
  </svg>
)
