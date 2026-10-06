import { useRef, type ComponentPropsWithRef, type ReactNode } from "react"

import { useHover } from "#src/components/hooks/useHover.ts"
import { ExtentSlider, type ExtentSliderHandle } from "#src/components/ui/ExtentSlider.tsx"
import { TriangleIcon } from "#src/components/ui/icons.tsx"
import { NumberField, type NumberFieldHandle } from "#src/components/ui/NumberField.tsx"
import { Phrases, type Phrase } from "#src/components/ui/Phrases.tsx"
import { PointMark } from "#src/components/ui/PointMark.tsx"
import { themeColorVar } from "#src/state/useAppTheme.ts"
import { formatNumber } from "#src/util/format/number.ts"

import type { Extent } from "../../CartesianPlane/viewport.ts"
import type { PartUi } from "../model/selectors.ts"
import type { PartEvents } from "../model/state.ts"
import type { ReadoutSlots } from "./readoutFit.ts"

import {
  COMPACT_POINT_ROLES,
  COMPACT_Q_NOTES,
  MOVED_LABEL,
  movedBy,
  OFF_VIEW_ROLES,
  P_FIELD_LABEL,
  P_NOTE,
  P_SCRUBBER_LABEL,
  POINT_NAMES,
  POINT_ROLES,
  Q_NOTES,
} from "../copy.ts"
import { POINT_QUANTUM } from "../model/reducer.ts"
import { POINT_INK } from "../planeScene.ts"
import style from "./PointCard.module.css"
import { PointReadout } from "./PointReadout.tsx"

// One point's card (point-readout-fv): the head (the point's mark, its
// letter, its role caption, its readout at the far end), anything the point
// adds below, and a note. The caption gives way, whole, when a long readout
// needs its room; an off-view ▲ ▼ stays. Compact (the dock's cards, R9;
// figma0 dockCard): the head names the point, a badge taking the caption's
// place while it shows, and the readout has a row of its own; off the view
// the caption stays as R9 draws it (the plane's edge marker shows where P
// is) and says so to screen readers.
function PointCard({
  series,
  caption,
  off,
  badge,
  readout,
  note,
  compact = false,
  children,
  ...rest
}: {
  series: "p" | "q"
  /** The point's role: "Pinned", "Follows pointer". */
  caption: string
  /** f(P) above or below the view: a ▲ ▼ mark and the caption in --foreground. */
  off?: "above" | "below" | null
  /** Before the readout, e.g. P's "moved +1". */
  badge?: ReactNode
  readout: ReactNode
  /** The note under the card's parts; none in P's compact card. */
  note: readonly Phrase[] | null
  compact?: boolean
  children?: ReactNode
} & ComponentPropsWithRef<"div">) {
  const offView = off !== undefined && off !== null ? off : null
  return (
    <div className={style.card} data-compact={compact || undefined} {...rest}>
      <div className={style.head}>
        <PointMark
          kind={series === "p" ? "bullseye" : "ring"}
          size={compact ? 18 : 20}
          ink={themeColorVar(POINT_INK[series])}
        />
        <var className={style.letter}>{POINT_NAMES[series]}</var>
        {offView !== null && !compact && (
          <span className={style.off_mark}>
            <TriangleIcon dir={offView === "above" ? "up" : "down"} width={10} height={9} />
          </span>
        )}
        <span className={style.caption_slot}>
          {compact && badge !== null && badge !== undefined ? (
            badge
          ) : (
            <span className={style.caption} data-off={compact ? undefined : (offView ?? undefined)}>
              {caption}
            </span>
          )}
        </span>
        {compact && offView !== null && <span className={style.hidden}>{OFF_VIEW_ROLES[offView]}</span>}
        {!compact && badge}
        {!compact && readout}
      </div>
      {compact && <div className={style.readout_row}>{readout}</div>}
      {children}
      {note !== null && (
        <p className={style.note}>
          <Phrases phrases={note} words={compact} />
        </p>
      )}
    </div>
  )
}

// P's card: the readout, whose x is P's value field (Enter on the scrubber
// opens it, Enter applies, Esc restores), and the scrubber over the plane's
// visible x-range. The card lights the hint while hovered or focused and
// takes a 2 px --primary border while P is dragged (Components › drag).
// While a transform's drag moves P, a badge says how far (FV 04, R5).
export function PCard({
  x,
  y,
  extent,
  off,
  moved,
  slots,
  ui,
  events,
  onChange,
  compact = false,
}: {
  x: number
  y: number
  extent: Pick<Extent, "minX" | "maxX"> | null
  /** The readout's slots for the plane's visible range. */
  slots: ReadoutSlots | null
  off: "above" | "below" | null
  /** How far a transform's drag has moved f(P), while it shows; null otherwise. */
  moved: number | null
  ui: PartUi
  events: PartEvents
  onChange: (next: number) => void
  /** The dock's card (R9). */
  compact?: boolean
}) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<NumberFieldHandle | null>(null)
  const scrubberRef = useRef<ExtentSliderHandle | null>(null)
  const hover = useHover(cardRef, events.onHover)
  const ink = themeColorVar(POINT_INK.p)
  return (
    <PointCard
      ref={cardRef}
      series="p"
      caption={compact ? COMPACT_POINT_ROLES.p : off === null ? POINT_ROLES.p : OFF_VIEW_ROLES[off]}
      off={off}
      compact={compact}
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
          compact={compact}
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
                  scrubberRef.current?.focus()
                }
              }}
            />
          }
        />
      }
      note={compact ? null : P_NOTE}
    >
      <ExtentSlider
        ref={scrubberRef}
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
        className={style.scrubber}
        testId="fv-p-scrubber"
      />
    </PointCard>
  )
}

// Q's card: live while the pointer is on the plane, placeholders while not.
// Both states have the same rows, so the card never changes height.
export function QCard({
  x,
  y,
  slots,
  compact = false,
}: {
  x: number | null
  y: number | null
  /** The readout's slots for the plane's visible range. */
  slots: ReadoutSlots | null
  compact?: boolean
}) {
  const notes = compact ? COMPACT_Q_NOTES : Q_NOTES
  return (
    <PointCard
      series="q"
      caption={compact ? COMPACT_POINT_ROLES.q : POINT_ROLES.q}
      compact={compact}
      data-testid="fv-point-q"
      data-part="q-card"
      readout={<PointReadout testId="fv-q-readout" x={x} y={y} slots={slots} compact={compact} />}
      note={x === null ? notes.empty : notes.live}
    />
  )
}
