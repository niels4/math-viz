import { useImperativeHandle, useRef, type Ref } from "react"

import { useHover } from "#src/components/hooks/useHover.ts"
import { FlipIcon, ResetIcon } from "#src/components/ui/icons.tsx"
import { MathText } from "#src/components/ui/MathText.tsx"
import { NumberBox, type NumberBoxHandle } from "#src/components/ui/NumberBox.tsx"
import { formatStored } from "#src/util/format/number.ts"

import type { PartUi } from "../model/selectors.ts"
import type { FvExplainBy, PartEvents } from "../model/state.ts"

import { FLIP_LABELS, modeBadge, PARAM_NAMES, resetLabel } from "../copy.ts"
import { acceptsValue, DEFAULT_PARAMS, isScale, ZERO_SCALE, type TransformParam } from "../math/form.ts"
import { useChipExplainer } from "../panel/useChipExplainer.ts"
import style from "./ParamRow.module.css"

export type ParamRowHandle = { focus: () => void }

// One transform as a row (figma0 SB · B › Number row, SB3 · C3): the letter
// chip as its colour key, the name (a held modifier's badge mid-drag), the
// flip toggle for a scale, ↺ while the value is off its default, and the
// number box, the row's one tab stop. Everything that marks the parameter
// takes its colour (--param-<p>): the chip, the toggle's glyph, the box's
// outline, arrows and value. The row takes a soft band of it while its
// value is the active one (FV 04: hovered, focused, dragged or typed into,
// or a partner of it, its term or a handle), and ↺ steps out of a drag so
// the row holds still. The chip opens the parameter's explainer (D12).
export function ParamRow({
  param,
  value,
  ui,
  events,
  onChange,
  onReset,
  onFlip,
  onExplain,
  explainerId,
  ref,
}: {
  param: TransformParam
  value: number
  ui: PartUi
  events: PartEvents
  /** The value typed into the box (FV 05: a jump), or dragged, keyed or wheeled (direct). */
  onChange: (next: number, typed: boolean) => void
  onReset: () => void
  /** The scales' flip toggle: a turns the curve upside down, b mirrors it (FV 13). */
  onFlip?: () => void
  onExplain?: (by: FvExplainBy, open: boolean | "toggle") => void
  /** The open explainer's id while it is this row's: it describes the box. */
  explainerId?: string | undefined
  ref?: Ref<ParamRowHandle>
}) {
  const rowRef = useRef<HTMLDivElement | null>(null)
  const boxRef = useRef<NumberBoxHandle | null>(null)
  const hover = useHover(rowRef, events.onHover)
  const explain = useChipExplainer(onExplain)
  useImperativeHandle(ref, () => ({ focus: () => boxRef.current?.focus() }), [])
  const { lit, mode, fine, edit } = ui
  const scale = isScale(param)
  const names = PARAM_NAMES[param]
  const changed = value !== DEFAULT_PARAMS[param]
  const error = edit !== null && edit.error !== null
  const badge = mode === "fine" || mode === "snap" ? modeBadge(mode, scale) : null
  return (
    // The row hears ? from whichever of its parts has the focus: delegation,
    // not a control of its own.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={rowRef}
      className={style.row}
      data-param={param}
      data-testid={`fv-param-${param}`}
      data-part={`control-${param}`}
      data-lit={(lit && !error) || undefined}
      data-mode={mode ?? undefined}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      onFocus={() => events.onFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          events.onFocus(false)
        }
      }}
      onKeyDown={explain.onKeyDown}
    >
      {/* Pointer-only, hidden from screen readers: ? on the focused row is the keyboard's way in (FV 07). */}
      <span
        className={style.chip}
        data-chip={param}
        data-testid={`fv-param-${param}-chip`}
        aria-hidden="true"
        {...explain.chip}
      >
        <MathText text={param} />
      </span>
      <span className={style.name_slot}>
        {badge === null ? (
          <span className={style.name}>{names.name}</span>
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
      {changed && mode === null && (
        // Not a tab stop: Backspace on the box resets, and the button
        // leaves the row once used (FV 07 › Reset).
        <button
          type="button"
          tabIndex={-1}
          className={`${style.button} ${style.reset}`}
          aria-label={resetLabel(param, DEFAULT_PARAMS[param])}
          data-testid={`fv-param-${param}-reset`}
          onClick={onReset}
        >
          <ResetIcon />
        </button>
      )}
      <NumberBox
        ref={boxRef}
        value={value}
        kind={scale ? "multiplicative" : "additive"}
        onChange={(next) => onChange(next, false)}
        onCommit={(next) => onChange(next, true)}
        onReset={onReset}
        validate={(next) => (acceptsValue(param, next) ? null : ZERO_SCALE)}
        format={(v) => formatStored(v, fine)}
        label={`${param}: ${names.name}`}
        describedBy={explainerId}
        onModeChange={events.onDrag}
        onEditChange={events.onEdit}
        held={mode}
        hot={lit && edit === null}
        className={style.box}
        testId={`fv-param-${param}`}
      />
    </div>
  )
}
