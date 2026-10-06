import type { CSSProperties } from "react"

import style from "./PointMark.module.css"

// A point's mark in the panel, the shapes the plane draws (scene.ts): a
// bullseye for a pinned point (a 2 px --foreground ring, a core half its
// size in the point's ink), a ring for a probe (a 2.5 px ring in its ink
// around a --foreground centre a quarter its size). Strokes sit inside the box, as
// in Figma. Parked: a dashed ring in the ink, no core, for a scrubber thumb
// whose point lies past the track's end (FV 07).
export function PointMark({
  kind,
  size,
  ink,
  parked = false,
}: {
  kind: "bullseye" | "ring"
  size: number
  /** The point's colour, e.g. var(--chart-point-1). */
  ink: string
  parked?: boolean
}) {
  const c = size / 2
  const ringWidth = kind === "ring" && !parked ? 2.5 : 2
  return (
    <svg
      className={style.mark}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ "--mark-ink": ink } as CSSProperties}
      aria-hidden="true"
    >
      <circle
        className={parked ? style.parked : kind === "ring" ? style.probe_ring : style.ring}
        cx={c}
        cy={c}
        r={c - ringWidth / 2}
        strokeWidth={ringWidth}
      />
      {!parked && (
        <circle
          className={kind === "ring" ? style.centre : style.core}
          cx={c}
          cy={c}
          r={kind === "ring" ? size / 8 : size / 4}
        />
      )}
    </svg>
  )
}
