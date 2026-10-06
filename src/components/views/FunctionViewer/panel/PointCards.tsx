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

import {
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
  readout,
  note,
  children,
  ...rest
}: {
  series: "p" | "q"
  /** The point's role: "Pinned", "Follows pointer". */
  caption: string
  /** f(P) above or below the view: a ▲ ▼ mark and the caption in --foreground. */
  off?: "above" | "below" | null
  readout: ReactNode
  note: readonly Phrase[]
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
        {readout}
      </div>
      {children}
      <p className={style.note}>
        <Phrases phrases={note} />
      </p>
    </div>
  )
}

// P's card: the readout, whose x is P's value field (Enter on the scrubber
// opens it, Enter applies, Esc restores), and the scrubber over the plane's
// visible x-range. The card lights the hint while hovered or focused and
// takes a 2 px --primary border while P is dragged (Components › drag).
export function PCard({
  x,
  y,
  extent,
  off,
  ui,
  events,
  onChange,
}: {
  x: number
  y: number
  extent: Pick<Extent, "minX" | "maxX"> | null
  off: "above" | "below" | null
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
// Both states have the same rows, so the card never changes height.
export function QCard({ x, y }: { x: number | null; y: number | null }) {
  return (
    <PointCard
      series="q"
      caption={POINT_ROLES.q}
      data-testid="fv-point-q"
      readout={<PointReadout testId="fv-q-readout" x={x} y={y} />}
      note={x === null ? Q_NOTES.empty : Q_NOTES.live}
    />
  )
}
