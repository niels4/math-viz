import { useLayoutEffect, useRef, useState } from "react"

import type { ScrubMode } from "./scrub.ts"

import style from "./Ruler.module.css"
import { rulerMarks } from "./rulerMarks.ts"

const TICK_LENGTH = { minor: 3, mid: 6, major: 9 }
const LABEL_BASELINE = 25
const INDEX = { width: 3, pointerWidth: 8.6, pointerHeight: 5 }
const CHEVRON = { inset: 6, width: 5, height: 10 }

const tickPath = (xs: number[], length: number) => xs.map((x) => `M${x.toFixed(2)} 0V${length}`).join("")

const chevronPath = (x: number, y: number, dir: 1 | -1) => {
  const open = x + dir * CHEVRON.width
  return `M${open} ${y - CHEVRON.height / 2}L${x} ${y}L${open} ${y + CHEVRON.height / 2}`
}

export const Ruler = ({ value, isScale, mode }: { value: number; isScale: boolean; mode: ScrubMode }) => {
  const tapeRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const tape = tapeRef.current
    if (tape !== null) {
      setSize({ width: tape.clientWidth, height: tape.clientHeight })
    }
  }, [])

  return (
    <div className={style.ruler} aria-hidden="true">
      <div ref={tapeRef} className={style.tape} data-mode={mode}>
        {size !== null && <Marks value={value} isScale={isScale} width={size.width} height={size.height} />}
      </div>
    </div>
  )
}

const Marks = ({
  value,
  isScale,
  width,
  height,
}: {
  value: number
  isScale: boolean
  width: number
  height: number
}) => {
  const marks = rulerMarks(value, width, isScale)
  const c = width / 2
  const halfPointer = INDEX.pointerWidth / 2
  return (
    <svg className={style.marks} width={width} height={height}>
      <path className={style.tick} d={tickPath(marks.minor, TICK_LENGTH.minor)} strokeWidth={1} />
      <path className={style.tick} d={tickPath(marks.mid, TICK_LENGTH.mid)} strokeWidth={1} />
      <path className={style.tick} d={tickPath(marks.major, TICK_LENGTH.major)} strokeWidth={1.5} />
      {marks.labels.map(({ x, text }) => (
        <text key={text} className={style.label} x={x} y={LABEL_BASELINE}>
          {text}
        </text>
      ))}
      <rect className={style.index} x={c - INDEX.width / 2} y={0} width={INDEX.width} height={height} />
      <path
        className={style.index}
        d={`M${c - halfPointer} ${height}H${c + halfPointer}L${c} ${height - INDEX.pointerHeight}Z`}
      />
      <path
        className={style.chevrons}
        d={chevronPath(CHEVRON.inset, height / 2, 1) + chevronPath(width - CHEVRON.inset, height / 2, -1)}
      />
    </svg>
  )
}
