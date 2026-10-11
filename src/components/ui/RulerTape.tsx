import { useLayoutEffect, useRef, useState } from "react"

import type { ScrubKind, ScrubMode } from "./scrub.ts"

import { RULER_HEIGHT, TICK_LENGTH, rulerMarks } from "./scrubRuler.ts"
import stripStyles from "./ScrubStrip.module.css"

const px = (v: number): number => Math.round(v * 100) / 100

const tickPath = (xs: readonly number[], length: number): string =>
  xs.map((x) => `M${px(x)} 0V${length}`).join("")

// The jog ruler's drawing (figma0 fvTape; decision D24): ticks, labels and
// the home notch on a tape that slides under a fixed index, so the value
// under the index is the current one, and chevrons at the ends. The ticks,
// labels and notch carry data-nudge, so a view can slide them under the
// index (FV 05). The index thickens while the tape is held. ScrubStrip draws
// it inside its spin button; RulerTape draws it alone.
export function RulerMarks({
  kind,
  value,
  width,
  held,
}: {
  kind: ScrubKind
  value: number
  width: number
  held: boolean
}) {
  if (width <= 0) {
    return null
  }
  const marks = rulerMarks(kind, value, width)
  const c = width / 2
  const indexWidth = held ? 3 : 2
  return (
    <>
      <svg className={stripStyles.marks} width={width} height={RULER_HEIGHT} aria-hidden="true">
        <g data-nudge="">
          <path className={stripStyles.tick} d={tickPath(marks.minor, TICK_LENGTH.minor)} strokeWidth={1} />
          <path className={stripStyles.tick} d={tickPath(marks.mid, TICK_LENGTH.mid)} strokeWidth={1} />
          <path className={stripStyles.tick} d={tickPath(marks.major, TICK_LENGTH.major)} strokeWidth={1.5} />
          {marks.home !== null && (
            <path
              className={stripStyles.home}
              d={`M${px(marks.home - 4)} 0H${px(marks.home + 4)}L${px(marks.home)} 6Z`}
            />
          )}
        </g>
        <rect
          className={stripStyles.index}
          x={c - indexWidth / 2}
          y={0}
          width={indexWidth}
          height={RULER_HEIGHT}
        />
        <path
          className={stripStyles.index}
          d={`M${c - 6} ${RULER_HEIGHT}H${c + 6}L${c} ${RULER_HEIGHT - 7}Z`}
        />
        <path
          className={stripStyles.chevrons}
          d={`M13 11L8 16L13 21M${width - 13} 11L${width - 8} 16L${width - 13} 21`}
        />
      </svg>
      <span className={stripStyles.tape} data-nudge="" aria-hidden="true">
        {marks.labels.map((mark) => (
          <span key={mark.text} className={stripStyles.label} style={{ left: mark.left }}>
            {mark.text}
          </span>
        ))}
      </span>
    </>
  )
}

// The jog ruler as a picture, held in a drag's mode: what a number box's
// drag shows under its row (figma0 SB · B, SB3 · C3), so the range shows
// while the drag holds it. It measures itself before it paints.
export function RulerTape({
  kind,
  value,
  mode,
  className,
}: {
  kind: ScrubKind
  value: number
  mode: ScrubMode
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) {
      return
    }
    setWidth(el.getBoundingClientRect().width)
    if (typeof ResizeObserver !== "function") {
      return
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry !== undefined) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={className === undefined ? stripStyles.strip : `${stripStyles.strip} ${className}`}
      data-mode={mode}
      aria-hidden="true"
    >
      <RulerMarks kind={kind} value={value} width={width} held />
    </div>
  )
}
