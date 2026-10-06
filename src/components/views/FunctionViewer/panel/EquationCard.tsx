import { useRef, useState, type HTMLAttributes, type PointerEvent } from "react"

import { useFitWidth } from "#src/components/hooks/useFitWidth.ts"

import type { BaseFunctionSlug } from "../math/baseFunctions.ts"

import { FORM_LABEL } from "../copy.ts"
import { describeEquation, equationTokens } from "../math/equation.ts"
import { TRANSFORM_PARAMS, type TransformParam, type TransformParams } from "../math/form.ts"
import style from "./EquationCard.module.css"
import { EquationTokens } from "./EquationTokens.tsx"
import { TermTip } from "./TermTip.tsx"

type Line = "live" | "form"

const isParam = (s: string | null): s is TransformParam =>
  s !== null && (TRANSFORM_PARAMS as readonly string[]).includes(s)

/** The term and the line under the pointer, from the element it is over. */
const termAt = (target: EventTarget | null): { param: TransformParam | null; line: Line | null } => {
  const el = target instanceof Element ? target : null
  const param = el?.closest("[data-param]")?.getAttribute("data-param") ?? null
  const line = el?.closest("[data-line]")?.getAttribute("data-line") ?? null
  return {
    param: isParam(param) ? param : null,
    line: line === "live" || line === "form" ? line : null,
  }
}

// The equation under the picker: the live line prints the values and hides
// what is at its default (but keeps a term while it is dragged, so the
// grabbed term stays under the pointer); the form line prints every
// letter, a parameter at its default as a dashed ghost slot (decision D13).
// Every term is its parameter's partner (FV 04): it lights with it, drags
// like its ruler (D13: "terms are draggable like their rulers"), and names
// it in a tip while the pointer is on it (FV 02 › H3). Screen readers get
// both lines as plain text. The live line keeps to one line and shrinks to
// fit its row where long values would overflow it. Compact (the dock, R9):
// the live line alone, without the card; the form line is read aloud only.
export function EquationCard({
  fn,
  params,
  lit,
  keep,
  tip,
  onPointer,
  onLeave,
  bindTerm,
  compact = false,
}: {
  fn: BaseFunctionSlug
  params: TransformParams
  /** The parameters lit as partners of the active value. */
  lit: readonly TransformParam[]
  /** Parameters whose live term stays at its default: they are being dragged. */
  keep: readonly TransformParam[]
  /** The parameter whose term shows its tip (the one under the pointer), or null. */
  tip: TransformParam | null
  /** The pointer on the card, over a term or between them. */
  onPointer: (over: TransformParam | null) => void
  onLeave: () => void
  bindTerm: (param: TransformParam) => HTMLAttributes<HTMLSpanElement>
  compact?: boolean
}) {
  // Only the term under the pointer hangs the tip, in the line it is in.
  const [line, setLine] = useState<Line | null>(null)
  const live = equationTokens(fn, params, "live", keep)
  const form = equationTokens(fn, params, "form")
  const said = describeEquation(live)
  const rowRef = useRef<HTMLOutputElement | null>(null)
  const lineRef = useRef<HTMLSpanElement | null>(null)
  useFitWidth(rowRef, lineRef)
  const track = (event: PointerEvent<HTMLDivElement>) => {
    const at = termAt(event.target)
    setLine(at.line)
    onPointer(at.param)
  }
  const options = (which: Line) => ({
    lit,
    bindTerm,
    renderUnder: (param: TransformParam) =>
      param === tip && which === line ? <TermTip param={param} value={params[param]} /> : null,
  })
  return (
    <div
      className={style.card}
      data-compact={compact || undefined}
      data-testid="fv-equation"
      data-part="equation"
      onPointerOver={track}
      onPointerLeave={() => {
        setLine(null)
        onLeave()
      }}
    >
      <output ref={rowRef} className={style.live} data-testid="func-readout" aria-label={said}>
        <span ref={lineRef} className={style.line} data-line="live" aria-hidden="true">
          <EquationTokens tokens={live} {...options("live")} />
        </span>
      </output>
      {compact ? (
        <p className={style.hidden} data-testid="fv-form">
          {FORM_LABEL}: {describeEquation(form)}
        </p>
      ) : (
        <p className={style.form_row} data-testid="fv-form">
          <span className={style.form_label}>{FORM_LABEL}</span>
          <span className={style.hidden}>: {describeEquation(form)}</span>
          <span className={style.form} data-line="form" aria-hidden="true">
            <EquationTokens tokens={form} {...options("form")} />
          </span>
        </p>
      )}
    </div>
  )
}
