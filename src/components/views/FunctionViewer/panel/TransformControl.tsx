import { useImperativeHandle, useRef, useState, type Ref } from "react"

import type { ScrubMode } from "#src/components/ui/scrub.ts"

import { useHover } from "#src/components/hooks/useHover.ts"
import { FlipIcon, ResetIcon } from "#src/components/ui/icons.tsx"
import { MathText } from "#src/components/ui/MathText.tsx"
import { NumberField, type NumberFieldEdit, type NumberFieldHandle } from "#src/components/ui/NumberField.tsx"
import { ScrubStrip, type ScrubStripHandle } from "#src/components/ui/ScrubStrip.tsx"

import { FLIP_LABELS, modeBadge, PARAM_NAMES, resetLabel } from "../copy.ts"
import { acceptsValue, DEFAULT_PARAMS, isScale, type TransformParam } from "../math/form.ts"
import style from "./TransformControl.module.css"

export type TransformControlHandle = { focus: () => void }

/** The field's refusal of a typed scale of 0 (FV 07: "A scale of 0 squashes the curve flat"). */
const ZERO_SCALE = "zero-scale"

// One transform (figma0 transform-control-fv; decision D24): the letter
// chip, the short name (a held modifier's badge mid-drag), a flip toggle for
// the scales, ↺ while the value is off its default, the value field, and the
// jog ruler below. The ruler is the control's tab stop: Enter types into the
// field and the focus comes back after. The control lights (chip in
// --primary) while hovered, focused, dragged or typed into, but not on
// refused text, as on the Components board.
export function TransformControl({
  param,
  value,
  onChange,
  onReset,
  onFlip,
  ref,
}: {
  param: TransformParam
  value: number
  onChange: (next: number) => void
  onReset: () => void
  /** The scales' flip toggle: a turns the curve upside down, b mirrors it (FV 13). */
  onFlip?: () => void
  ref?: Ref<TransformControlHandle>
}) {
  const scale = isScale(param)
  const names = PARAM_NAMES[param]
  const name = `${param}: ${names.name}`
  const rulerRef = useRef<ScrubStripHandle | null>(null)
  const fieldRef = useRef<NumberFieldHandle | null>(null)
  const controlRef = useRef<HTMLDivElement | null>(null)
  const hover = useHover(controlRef)
  const hovered = hover.hovered
  const [mode, setMode] = useState<ScrubMode | null>(null)
  const [edit, setEdit] = useState<NumberFieldEdit | null>(null)
  useImperativeHandle(ref, () => ({ focus: () => rulerRef.current?.focus() }), [])

  const changed = value !== DEFAULT_PARAMS[param]
  const error = edit !== null && edit.error !== null
  const typing = edit !== null && !error
  const badge = mode === "fine" || mode === "snap" ? modeBadge(mode, scale) : null
  return (
    <div
      ref={controlRef}
      className={style.control}
      data-testid={`fv-param-${param}`}
      data-lit={((hovered || mode !== null || typing) && !error) || undefined}
      data-error={error || undefined}
      data-mode={mode ?? undefined}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
    >
      <div className={style.head} data-flip={onFlip === undefined ? undefined : true}>
        <span className={style.chip} data-testid={`fv-param-${param}-chip`} aria-hidden="true">
          <MathText text={param} />
        </span>
        <span className={style.name_slot}>
          {badge === null ? (
            <span className={style.name}>{names.short}</span>
          ) : (
            <span className={style.badge} data-mode={mode}>
              {badge}
            </span>
          )}
        </span>
        {onFlip !== undefined && (
          <button
            type="button"
            className={`${style.button} ${style.flip}`}
            aria-label={FLIP_LABELS[param === "a" ? "a" : "b"]}
            aria-pressed={value < 0}
            data-testid={`fv-param-${param}-flip`}
            onClick={onFlip}
          >
            <FlipIcon axis={param === "a" ? "vertical" : "horizontal"} />
          </button>
        )}
        {changed && (
          // Not a tab stop: Backspace on the ruler resets, and the button
          // leaves the page once used (FV 07 › Reset).
          <button
            type="button"
            tabIndex={-1}
            className={style.button}
            aria-label={resetLabel(param, DEFAULT_PARAMS[param])}
            data-testid={`fv-param-${param}-reset`}
            onClick={onReset}
          >
            <ResetIcon />
          </button>
        )}
        <NumberField
          ref={fieldRef}
          value={value}
          onCommit={onChange}
          validate={(next) => (acceptsValue(param, next) ? null : ZERO_SCALE)}
          label={`${name}, value`}
          testId={`fv-param-${param}-field`}
          tabIndex={-1}
          hot={hovered && mode === null}
          muted={!changed}
          onEditChange={setEdit}
          onEditEnd={(how) => {
            if (how !== "blur") {
              rulerRef.current?.focus()
            }
          }}
        />
      </div>
      <ScrubStrip
        ref={rulerRef}
        value={value}
        onChange={onChange}
        onReset={onReset}
        kind={scale ? "multiplicative" : "additive"}
        label={name}
        onEditRequest={() => fieldRef.current?.edit()}
        onModeChange={setMode}
        hot={hovered && edit === null}
        dimmed={typing}
        testId={`fv-param-${param}-ruler`}
      />
    </div>
  )
}
