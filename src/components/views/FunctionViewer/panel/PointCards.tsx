import { useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react"

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

import {
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
// needs its room; an off-view ▲ ▼ stays.
function PointCard({
  series,
  caption,
  off,
  badge,
  readout,
  note,
  noteFade,
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
  note: readonly Phrase[]
  /** The note fading in as it changes (Q's card, FV 05): each new key starts the fade again. */
  noteFade?: { dir: "in" | "out"; key: number } | undefined
  children?: ReactNode
} & ComponentPropsWithRef<"div">) {
  return (
    <div className={style.card} {...rest}>
      <div className={style.head}>
        <PointMark
          kind={series === "p" ? "bullseye" : "ring"}
          size={20}
          ink={themeColorVar(POINT_INK[series])}
        />
        <var className={style.letter}>{POINT_NAMES[series]}</var>
        {off !== undefined && off !== null && (
          <span className={style.off_mark}>
            <TriangleIcon dir={off === "above" ? "up" : "down"} width={10} height={9} />
          </span>
        )}
        <span className={style.caption_slot}>
          <span className={style.caption} data-off={off ?? undefined}>
            {caption}
          </span>
        </span>
        {badge}
        {readout}
      </div>
      {children}
      <p key={noteFade?.key} className={style.note} data-fade={noteFade?.dir}>
        <Phrases phrases={note} />
      </p>
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
  ui: PartUi
  events: PartEvents
  onChange: (next: number) => void
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
      caption={off === null ? POINT_ROLES.p : OFF_VIEW_ROLES[off]}
      off={off}
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
      note={P_NOTE}
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
// Both states have the same rows, so the card never changes height. As the
// pointer enters or leaves the plane its values fade in (FV 05): the readout
// and the note mount afresh on each change, which starts their fade again.
export function QCard({ x, y }: { x: number | null; y: number | null }) {
  const live = x !== null
  const [shown, setShown] = useState({ live, changes: 0 })
  if (shown.live !== live) {
    setShown({ live, changes: shown.changes + 1 })
  }
  const fade =
    shown.changes === 0 ? undefined : { dir: live ? ("in" as const) : ("out" as const), key: shown.changes }
  return (
    <PointCard
      series="q"
      caption={POINT_ROLES.q}
      data-testid="fv-point-q"
      data-part="q-card"
      readout={
        <span key={shown.changes} className={style.value} data-fade={fade?.dir}>
          <PointReadout testId="fv-q-readout" x={x} y={y} />
        </span>
      }
      note={live ? Q_NOTES.live : Q_NOTES.empty}
      noteFade={fade}
    />
  )
}
