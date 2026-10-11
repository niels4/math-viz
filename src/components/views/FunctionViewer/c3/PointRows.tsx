import { useRef, useState, type ReactNode } from "react"

import { useHover } from "#src/components/hooks/useHover.ts"
import { ExtentSlider, type ExtentSliderHandle } from "#src/components/ui/ExtentSlider.tsx"
import { TriangleIcon } from "#src/components/ui/icons.tsx"
import { NumberField, type NumberFieldHandle } from "#src/components/ui/NumberField.tsx"
import { PointMark } from "#src/components/ui/PointMark.tsx"
import { themeColorVar } from "#src/state/useAppTheme.ts"
import { formatNumber, formatStored } from "#src/util/format/number.ts"

import type { Extent } from "../../CartesianPlane/viewport.ts"
import type { PartUi } from "../model/selectors.ts"
import type { PartEvents } from "../model/state.ts"
import type { ReadoutSlots } from "../panel/readoutFit.ts"

import { HINTS, MOVED_LABEL, movedBy, P_FIELD_LABEL, P_SCRUBBER_LABEL, POINT_NAMES } from "../copy.ts"
import { POINT_QUANTUM } from "../model/reducer.ts"
import { PointReadout } from "../panel/PointReadout.tsx"
import { POINT_INK } from "../planeScene.ts"
import { C3_OFF_VIEW_ROLES, C3_POINT_ROLES } from "./c3Copy.ts"
import style from "./PointRows.module.css"
import { Tip } from "./Tip.tsx"

// One point's head row (SB3 · C3 › Points): its mark, its letter, its role,
// anything it adds, and its readout at the far end. The role gives way,
// whole, when a long readout needs its room; an off-view ▲ ▼ stays.
function PointHead({
  series,
  role,
  off = null,
  badge,
  readout,
}: {
  series: "p" | "q"
  role: ReactNode
  off?: "above" | "below" | null
  badge?: ReactNode
  readout: ReactNode
}) {
  return (
    <div className={style.head}>
      <PointMark
        kind={series === "p" ? "bullseye" : "ring"}
        size={18}
        ink={themeColorVar(POINT_INK[series])}
      />
      <var className={style.letter}>{POINT_NAMES[series]}</var>
      {off !== null && (
        <span className={style.off_mark}>
          <TriangleIcon dir={off === "above" ? "up" : "down"} width={10} height={9} />
        </span>
      )}
      <span className={style.role_slot}>{role}</span>
      {badge}
      {readout}
    </div>
  )
}

// P (SB3 · C3 › Point P): the head, whose readout's x is P's value field
// (Enter on the track opens it, Enter applies, Esc restores), over P's
// track across the plane's visible x-range. The row lights P's partners
// while hovered or focused (FV 04), and while a transform's drag moves P it
// says how far (R5's "moved"). While x is typed, a tip under the head
// names the keys, or why the text is refused.
export function PRow({
  x,
  y,
  extent,
  off,
  moved,
  slots,
  ui,
  events,
  onChange,
}: {
  x: number
  y: number
  extent: Pick<Extent, "minX" | "maxX"> | null
  off: "above" | "below" | null
  /** How far a transform's drag has moved f(P), while it shows; null otherwise. */
  moved: number | null
  /** The readout's slots for the plane's visible range. */
  slots: ReadoutSlots | null
  ui: PartUi
  events: PartEvents
  onChange: (next: number) => void
}) {
  const rowRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<NumberFieldHandle | null>(null)
  const trackRef = useRef<ExtentSliderHandle | null>(null)
  const hover = useHover(rowRef, events.onHover)
  const ink = themeColorVar(POINT_INK.p)
  const { edit } = ui
  return (
    <div
      ref={rowRef}
      className={style.point}
      data-testid="fv-point-p"
      data-dragging={ui.mode !== null || undefined}
      onPointerEnter={hover.onPointerEnter}
      onPointerLeave={hover.onPointerLeave}
      onFocus={() => events.onFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          events.onFocus(false)
        }
      }}
    >
      <PointHead
        series="p"
        off={off}
        role={
          <span className={style.role} data-off={off ?? undefined}>
            {off === null ? C3_POINT_ROLES.p : C3_OFF_VIEW_ROLES[off]}
          </span>
        }
        badge={
          moved === null ? null : (
            <span className={style.moved} data-testid="fv-p-moved">
              <span className={style.moved_label}>{MOVED_LABEL}</span>
              <span className={style.moved_value}>{movedBy(moved)}</span>
            </span>
          )
        }
        readout={
          <PointReadout
            testId="fv-p-readout"
            x={x}
            y={y}
            slots={slots}
            xField={
              <NumberField
                ref={fieldRef}
                value={x}
                onCommit={onChange}
                format={formatNumber}
                label={P_FIELD_LABEL}
                testId="fv-p-field"
                tabIndex={-1}
                className={style.x_field}
                onEditChange={events.onEdit}
                onEditEnd={(how) => {
                  if (how !== "blur") {
                    trackRef.current?.focus()
                  }
                }}
              />
            }
          />
        }
      />
      <ExtentSlider
        ref={trackRef}
        look="line"
        value={x}
        min={extent?.minX ?? 0}
        max={extent?.maxX ?? 0}
        quantum={POINT_QUANTUM}
        onChange={onChange}
        label={P_SCRUBBER_LABEL}
        symbol="x"
        format={formatNumber}
        renderThumb={(parked) => <PointMark kind="bullseye" size={18} ink={ink} parked={parked} />}
        onEditRequest={() => fieldRef.current?.edit()}
        onDragChange={(dragging) => events.onDrag(dragging ? "coarse" : null)}
        testId="fv-p-scrubber"
      />
      {edit !== null && (
        <Tip
          phrases={edit.error === null ? HINTS.edit : HINTS.refused(edit.error, formatStored(edit.base))}
          tone={edit.error === null ? undefined : "error"}
          className={style.tip}
          testId="fv-p-tip"
        />
      )}
    </div>
  )
}

// Q (SB3 · C3 › Point Q): live while the pointer is on the plane,
// placeholders while not; its role says how to place it, then what it does.
// As the pointer enters or leaves the plane the readout and the role fade
// in (FV 05): they mount afresh on each change, which starts their fade.
export function QRow({ x, y, slots }: { x: number | null; y: number | null; slots: ReadoutSlots | null }) {
  const live = x !== null
  const [shown, setShown] = useState({ live, changes: 0 })
  if (shown.live !== live) {
    setShown({ live, changes: shown.changes + 1 })
  }
  const fade = shown.changes === 0 ? undefined : live ? "in" : "out"
  return (
    <div className={style.point} data-testid="fv-point-q" data-part="q-card">
      <PointHead
        series="q"
        role={
          <span key={shown.changes} className={style.role} data-fade={fade}>
            {live ? C3_POINT_ROLES.q.live : C3_POINT_ROLES.q.empty}
          </span>
        }
        readout={
          <span key={shown.changes} className={style.value} data-fade={fade}>
            <PointReadout testId="fv-q-readout" x={x} y={y} slots={slots} />
          </span>
        }
      />
    </div>
  )
}
