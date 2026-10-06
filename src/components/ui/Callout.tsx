import type { AriaRole, ReactNode, Ref } from "react"

import style from "./Callout.module.css"

/**
 * The caret standing out of a callout's card: from its left side, its tip
 * `at` px below the card's top, or from its top, `at` px right of its left edge.
 */
export type CalloutCaret = { side: "left" | "top"; at: number }

/**
 * plain: --card in a 1 px --border, the caret filled like the card with
 * bordered edges (help-popover-fv). accent: a 2 px --primary border and a
 * solid --primary caret (the tour's card).
 */
export type CalloutTone = "plain" | "accent"

// Each caret in the frame figma0 drew it in, placed so its tip lands on `at`.
function Caret({ tone, caret }: { tone: CalloutTone; caret: CalloutCaret }) {
  if (tone === "plain") {
    // 9 × 40, tip at (1, 20); the fill reaches 0.5 px into the card's border.
    return caret.side === "left" ? (
      <svg
        className={style.caret}
        width={9}
        height={40}
        style={{ left: -9, top: caret.at - 20 }}
        aria-hidden="true"
      >
        <polygon className={style.plain_fill} points="9.5,12 1,20 9.5,28" />
        <polyline className={style.plain_edge} points="9,12 1,20 9,28" />
      </svg>
    ) : (
      <svg
        className={style.caret}
        width={40}
        height={9}
        style={{ top: -9, left: caret.at - 20 }}
        aria-hidden="true"
      >
        <polygon className={style.plain_fill} points="12,9.5 20,1 28,9.5" />
        <polyline className={style.plain_edge} points="12,9 20,1 28,9" />
      </svg>
    )
  }
  return caret.side === "left" ? (
    <svg
      className={style.caret}
      width={10}
      height={18}
      style={{ left: -10, top: caret.at - 9 }}
      aria-hidden="true"
    >
      <polygon className={style.accent_fill} points="10,0 0,9 10,18" />
    </svg>
  ) : (
    <svg
      className={style.caret}
      width={18}
      height={10}
      style={{ top: -10, left: caret.at - 9 }}
      aria-hidden="true"
    >
      <polygon className={style.accent_fill} points="0,10 9,0 18,10" />
    </svg>
  )
}

// A card with a caret that points at what it is about, fixed to the
// viewport at (x, y), its card's top-left: an explainer beside its chip, a
// tour step beside what it spotlights. The owner places it (the rules
// differ per use) and decides when it closes.
export function Callout({
  x,
  y,
  width,
  tone,
  caret,
  children,
  className,
  role,
  label,
  labelledBy,
  tabIndex,
  testId,
  ref,
}: {
  x: number
  y: number
  width: number
  tone: CalloutTone
  caret: CalloutCaret
  children: ReactNode
  className?: string
  role?: AriaRole
  label?: string
  labelledBy?: string
  /** -1 lets the owner move the focus to the callout itself (a dialog as it opens). */
  tabIndex?: number
  testId?: string
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={ref}
      className={className === undefined ? style.callout : `${style.callout} ${className}`}
      style={{ left: x, top: y, width }}
      data-tone={tone}
      role={role}
      aria-label={label}
      aria-labelledby={labelledBy}
      tabIndex={tabIndex}
      data-testid={testId}
    >
      <Caret tone={tone} caret={caret} />
      {children}
    </div>
  )
}
