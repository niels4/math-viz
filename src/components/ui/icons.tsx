import type { GlyphDirection } from "./glyphPaths.ts"

import { ARROW_BOX, ARROW_PATHS, ARROW_STROKE, TRIANGLE_BOX, trianglePath } from "./glyphPaths.ts"

export function SnowflakeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17" />
      <path d="M12 2l-2 2.5M12 2l2 2.5M12 22l-2-2.5M12 22l2-2.5" />
    </svg>
  )
}

export function TagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" />
      <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </svg>
  )
}

export function TableIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M3 14.5h18M12 9.5v10.5" />
    </svg>
  )
}

export function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </svg>
  )
}

export function ButtonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10 9.5v5M10 9.5L7.5 12 10 14.5" />
    </svg>
  )
}

export function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a7.5 7.5 0 0 0 0-3l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.5 2.6a7.6 7.6 0 0 0-2.6 1.5l-2.3-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 3l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.5-2.6a7.6 7.6 0 0 0 2.6-1.5l2.3 1 2-3.4-2-1.5z" />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}

/** ▲ ▼ ◀ ▶, drawn: the shipped fonts lack U+25B2 / U+25BC / U+25C0 / U+25B6. */
export function TriangleIcon({
  dir,
  width = TRIANGLE_BOX,
  height = TRIANGLE_BOX,
}: {
  dir: GlyphDirection
  width?: number
  height?: number
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={trianglePath(dir, width, height)} />
    </svg>
  )
}

/** ← → ↑ ↓, drawn: the shipped fonts lack most of U+2190–2193. */
export function ArrowIcon({ dir }: { dir: GlyphDirection }) {
  return (
    <svg
      viewBox={`0 0 ${ARROW_BOX.width} ${ARROW_BOX.height}`}
      width={ARROW_BOX.width}
      height={ARROW_BOX.height}
      fill="none"
      stroke="currentColor"
      strokeWidth={ARROW_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ARROW_PATHS[dir]} />
    </svg>
  )
}

/** ↺ (fvResetGlyph): a 270° arc with its head at the start, in a 16 × 16 box. */
export function ResetIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M12.213 4.465A5.5 5.5 0 1 1 4.465 3.787"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M9.013 0.865L14.813 2.065L11.813 6.865Z" fill="currentColor" />
    </svg>
  )
}

/** ↕ (flip upside down) or ↔ (mirror), the flip toggle's glyphs (FV 13), in a 14 × 14 box. */
export function FlipIcon({ axis }: { axis: "vertical" | "horizontal" }) {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden="true">
      {axis === "vertical" ? (
        <>
          <path d="M7 2V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M3.5 5L7 0.5L10.5 5ZM3.5 9L7 13.5L10.5 9Z" />
        </>
      ) : (
        <>
          <path d="M2 7H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 3.5L0.5 7L5 10.5ZM9 3.5L13.5 7L9 10.5Z" />
        </>
      )}
    </svg>
  )
}

/** ✓, drawn: the shipped Work Sans subset has no U+2713. A 14 × 14 box. */
export function CheckIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 7.5L5.5 10.5L11.5 3.5" />
    </svg>
  )
}
