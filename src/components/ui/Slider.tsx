import { useRef, type KeyboardEvent, type PointerEvent } from "react"

import sliderStyles from "./Slider.module.css"

export function Slider({
  value,
  onChange,
  label,
  testId,
}: {
  value: number
  onChange: (next: number) => void
  label: string
  testId: string
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)

  const setFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (track === null) {
      return
    }
    const rect = track.getBoundingClientRect()
    if (rect.width === 0) {
      return
    }
    const ratio = (clientX - rect.left) / rect.width
    onChange(Math.round(Math.min(100, Math.max(0, ratio * 100))))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    setFromClientX(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return
    }
    setFromClientX(event.clientX)
  }

  const stopDragging = () => {
    draggingRef.current = false
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault()
      onChange(Math.min(100, value + (event.shiftKey ? 10 : 1)))
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault()
      onChange(Math.max(0, value - (event.shiftKey ? 10 : 1)))
    } else if (event.key === "Home") {
      event.preventDefault()
      onChange(0)
    } else if (event.key === "End") {
      event.preventDefault()
      onChange(100)
    }
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value} percent`}
      data-testid={testId}
      className={sliderStyles.slider_track}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onKeyDown={handleKeyDown}
    >
      <div className={sliderStyles.slider_fill} style={{ width: `${value}%` }} />
      <div className={sliderStyles.slider_knob} style={{ left: `${value}%` }} />
    </div>
  )
}
