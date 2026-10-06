import { useEffect, useImperativeHandle, useRef, type KeyboardEvent, type Ref } from "react"

import { useHover } from "#src/components/hooks/useHover.ts"
import { FlipIcon, ResetIcon } from "#src/components/ui/icons.tsx"
import { MathText } from "#src/components/ui/MathText.tsx"
import { NumberField, type NumberFieldHandle } from "#src/components/ui/NumberField.tsx"
import { ScrubStrip, type ScrubStripHandle } from "#src/components/ui/ScrubStrip.tsx"

import type { PartUi } from "../model/selectors.ts"
import type { FvExplainBy, PartEvents } from "../model/state.ts"

import { FLIP_LABELS, modeBadge, PARAM_NAMES, resetLabel } from "../copy.ts"
import { acceptsValue, DEFAULT_PARAMS, isScale, ZERO_SCALE, type TransformParam } from "../math/form.ts"
import { EXPLAINER_REST_MS } from "./explainer.ts"
import style from "./TransformControl.module.css"

export type TransformControlHandle = { focus: () => void }

// One transform (figma0 transform-control-fv; decision D24): the letter
// chip, the short name (a held modifier's badge mid-drag), a flip toggle for
// the scales, ↺ while the value is off its default, the value field, and the
// jog ruler below. The ruler is the control's tab stop: Enter types into the
// field and the focus comes back after. The control lights (chip in
// --primary, the ruler hot) while its value is the active one (FV 04): the
// control hovered, focused, dragged or typed into (not with refused text,
// as on the Components board), or a partner of it, its term or a handle.
// A term's or a handle's drag shows on the ruler as its own would. Its
// hover, drag and edit live in the view's state (`ui`), which hears of them
// through `events`. The letter chip opens the parameter's explainer (D12):
// resting on it 400 ms, a click or a tap, or ? while the control has the
// focus; the view decides what closes it.
export function TransformControl({
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
  /** The value typed into the field (FV 05: a jump), or the ruler's (direct). */
  onChange: (next: number, typed: boolean) => void
  onReset: () => void
  /** The scales' flip toggle: a turns the curve upside down, b mirrors it (FV 13). */
  onFlip?: () => void
  /** The explainer asked open or closed by one means, or toggled (D12). */
  onExplain?: (by: FvExplainBy, open: boolean | "toggle") => void
  /** The open explainer's id while it is this control's: it describes the ruler. */
  explainerId?: string | undefined
  ref?: Ref<TransformControlHandle>
}) {
  const scale = isScale(param)
  const names = PARAM_NAMES[param]
  const name = `${param}: ${names.name}`
  const rulerRef = useRef<ScrubStripHandle | null>(null)
  const fieldRef = useRef<NumberFieldHandle | null>(null)
  const controlRef = useRef<HTMLDivElement | null>(null)
  const hover = useHover(controlRef, events.onHover)
  const { hovered, lit, mode, edit } = ui
  useImperativeHandle(ref, () => ({ focus: () => rulerRef.current?.focus() }), [])

  // The chip's rest timer, and the kind of pointer that last pressed it:
  // a touch tap toggles, where a mouse click opens at once.
  const restTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressedBy = useRef<string>("mouse")
  const stopRest = () => {
    if (restTimer.current !== null) {
      clearTimeout(restTimer.current)
      restTimer.current = null
    }
  }
  useEffect(
    () => () => {
      if (restTimer.current !== null) {
        clearTimeout(restTimer.current)
      }
    },
    [],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "?" && !(event.target instanceof HTMLInputElement) && onExplain !== undefined) {
      event.preventDefault()
      onExplain("key", "toggle")
    }
  }

  const changed = value !== DEFAULT_PARAMS[param]
  const error = edit !== null && edit.error !== null
  const typing = edit !== null && !error
  const badge = mode === "fine" || mode === "snap" ? modeBadge(mode, scale) : null
  return (
    // The control hears ? from whichever of its parts has the focus (the
    // ruler, the flip toggle): delegation, not a control of its own.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={controlRef}
      className={style.control}
      data-testid={`fv-param-${param}`}
      data-part={`control-${param}`}
      data-lit={(lit && !error) || undefined}
      data-error={error || undefined}
      data-mode={mode ?? undefined}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      onFocus={() => events.onFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          events.onFocus(false)
        }
      }}
      onKeyDown={onKeyDown}
    >
      <div className={style.head} data-flip={onFlip === undefined ? undefined : true}>
        {/* Pointer-only, hidden from screen readers: ? on the focused control is the keyboard's way in (FV 07). */}
        <span
          className={style.chip}
          data-chip={param}
          data-testid={`fv-param-${param}-chip`}
          aria-hidden="true"
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch" && onExplain !== undefined) {
              stopRest()
              restTimer.current = setTimeout(() => onExplain("hover", true), EXPLAINER_REST_MS)
            }
          }}
          onPointerLeave={(event) => {
            stopRest()
            if (event.pointerType !== "touch") {
              onExplain?.("hover", false)
            }
          }}
          onPointerDown={(event) => {
            pressedBy.current = event.pointerType
          }}
          onClick={() => {
            stopRest()
            if (pressedBy.current === "touch") {
              onExplain?.("tap", "toggle")
            } else {
              onExplain?.("hover", true)
            }
          }}
        >
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
          onCommit={(next) => onChange(next, true)}
          validate={(next) => (acceptsValue(param, next) ? null : ZERO_SCALE)}
          label={`${name}, value`}
          testId={`fv-param-${param}-field`}
          tabIndex={-1}
          hot={hovered && mode === null}
          muted={!changed}
          onEditChange={events.onEdit}
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
        onChange={(next) => onChange(next, false)}
        onReset={onReset}
        kind={scale ? "multiplicative" : "additive"}
        label={name}
        describedBy={explainerId}
        onEditRequest={() => fieldRef.current?.edit()}
        onModeChange={events.onDrag}
        held={mode}
        hot={(hovered || lit) && edit === null}
        dimmed={typing}
        testId={`fv-param-${param}-ruler`}
      />
    </div>
  )
}
