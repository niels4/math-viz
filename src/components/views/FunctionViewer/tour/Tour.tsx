import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState, type Ref } from "react"

import { Callout } from "#src/components/ui/Callout.tsx"
import { Phrases, type Phrase } from "#src/components/ui/Phrases.tsx"

import type { Rect } from "../../CartesianPlane/rect.ts"
import type { FvTourStep } from "../model/state.ts"

import { TOUR } from "../copy.ts"
import style from "./Tour.module.css"
import {
  HAND_SIZE,
  HOLE_RADIUS,
  TOUR_CARD,
  TOUR_IDLE_MS,
  TOUR_STEPS,
  tourLayout,
  type TourLayout,
  type TourTargets,
} from "./tourSteps.ts"

/** Input that keeps step 1 from timing out: anything the visitor does. */
const ACTIVITY = ["pointermove", "pointerdown", "keydown", "wheel"] as const

const roundedRect = ({ x, y, w, h }: Rect, r: number): string =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
  `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`

const sameLayout = (a: TourLayout | null, b: TourLayout): boolean => JSON.stringify(a) === JSON.stringify(b)

// The ghost hand (FV 08 › step 2): four fingers, a thumb and a palm in
// --foreground edged in --background, drawn at 1.6×, and the dashed path
// it drags along, under the tape. It slides along the path unless motion
// is reduced (FV 08 › Rules).
function GhostHand({ x, y }: { x: number; y: number }) {
  return (
    <>
      <svg
        className={style.hand}
        style={{ left: x, top: y, width: HAND_SIZE, height: HAND_SIZE }}
        viewBox="0 0 26 26"
        aria-hidden="true"
        data-testid="fv-tour-hand"
      >
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={5.6 + i * 3.9} y={8} width={3.6} height={6} rx={1.8} />
        ))}
        <rect x={2} y={13} width={4} height={5} rx={2} />
        <rect x={5} y={11} width={16} height={11} rx={4} />
      </svg>
      <svg
        className={style.path}
        style={{ left: x + 30, top: y + 32 }}
        width={104}
        height={14}
        aria-hidden="true"
      >
        <line x1={0} y1={7} x2={94} y2={7} />
        <polygon points="102,7 92.2,2.1 92.2,11.9" />
      </svg>
    </>
  )
}

// A step's Skip tour and Next (Done on the last).
function StepActions({
  last,
  onNext,
  onEnd,
  buttonRef,
}: {
  last: boolean
  onNext: () => void
  onEnd: () => void
  buttonRef: Ref<HTMLButtonElement>
}) {
  return (
    <div className={style.footer}>
      {!last && (
        <button type="button" className={style.skip} data-testid="fv-tour-skip" onClick={onEnd}>
          {TOUR.skip}
        </button>
      )}
      <span className={style.spacer} />
      <button
        ref={buttonRef}
        type="button"
        className={style.next}
        data-testid="fv-tour-next"
        onClick={last ? onEnd : onNext}
      >
        {last ? TOUR.done : TOUR.next}
      </button>
    </div>
  )
}

// The first-minute tour (D19; FV 08, R1): the page dimmed to 62 % of its
// background but where the step's idea lives (a scrim with holes, never a
// blur), and the step's card beside it: progress, title, body, Skip tour and
// Next (Done on the last). The scrim takes no input, so the page works as
// it always does; each step completes on its real action (the reducer),
// Next is the fallback, step 1 also moves on after 6 s idle. `locate` finds
// the step's targets, followed every frame while the tour shows. It opens
// and closes on the overlays' motion; `closing`, it fades out and acts no
// more.
export function Tour({
  step,
  body,
  locate,
  onNext,
  onEnd,
  closing = false,
}: {
  step: FvTourStep
  /** The step's body; step 1's tells about the live curve. */
  body: readonly Phrase[]
  locate: () => TourTargets
  onNext: () => void
  onEnd: () => void
  /** On its way out (usePresence): shown as it was, inert. */
  closing?: boolean
}) {
  const id = useId()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [layout, setLayout] = useState<TourLayout | null>(null)
  const [view, setView] = useState({ width: 0, height: 0 })
  // The card glides between steps once it has been placed (a spring, or
  // nothing under reduced motion): never from where it was first drawn.
  const [settled, setSettled] = useState(false)

  const place = useEffectEvent((at: FvTourStep) => {
    const next = tourLayout(at, locate(), cardRef.current?.offsetHeight ?? 0, {
      width: innerWidth,
      height: innerHeight,
    })
    setLayout((prev) => (sameLayout(prev, next) ? prev : next))
    setView((prev) =>
      prev.width === innerWidth && prev.height === innerHeight
        ? prev
        : { width: innerWidth, height: innerHeight },
    )
  })
  const follow = useEffectEvent(() => place(step))
  // Placed before each step paints, then followed every frame: the panel,
  // the plane's curve and P move what it points at.
  useLayoutEffect(() => {
    place(step)
  }, [step])
  useEffect(() => {
    if (typeof requestAnimationFrame !== "function") {
      return
    }
    let frame = requestAnimationFrame(function loop() {
      follow()
      frame = requestAnimationFrame(loop)
    })
    // Placed for a frame: from now on a new step's place is a move.
    const settle = requestAnimationFrame(() => setSettled(true))
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(settle)
    }
  }, [])

  // Step 1 has no action of its own: it moves on after 6 s without input.
  const idle = useEffectEvent(() => onNext())
  useEffect(() => {
    if (step !== 1 || closing) {
      return
    }
    let timer = setTimeout(() => idle(), TOUR_IDLE_MS)
    const restart = () => {
      clearTimeout(timer)
      timer = setTimeout(() => idle(), TOUR_IDLE_MS)
    }
    for (const type of ACTIVITY) {
      addEventListener(type, restart, { capture: true, passive: true })
    }
    return () => {
      clearTimeout(timer)
      for (const type of ACTIVITY) {
        removeEventListener(type, restart, { capture: true })
      }
    }
  }, [step, closing])

  // The focus (FV 07): as the tour opens it goes to the card, a dialog a
  // screen reader announces, where Tab reaches Skip tour and Next, with no
  // ring drawn for a pointer user; from then on a step's button takes it
  // over from the step before's.
  const primaryRef = useRef<HTMLButtonElement | null>(null)
  // The step the focus last moved for: once per step, effects run twice or not.
  const focusedFor = useRef<FvTourStep | null>(null)
  const focusStep = useEffectEvent((shown: FvTourStep) => {
    if (focusedFor.current === shown) {
      return
    }
    const opening = focusedFor.current === null
    focusedFor.current = shown
    const active = document.activeElement
    const idle = active === null || active === document.body
    if (opening) {
      if (idle) {
        cardRef.current?.focus({ preventScroll: true })
      }
    } else if (idle || cardRef.current?.contains(active) === true) {
      primaryRef.current?.focus({ preventScroll: true })
    }
  })
  useEffect(() => {
    focusStep(step)
  }, [step])

  const last = step === TOUR_STEPS.at(-1)
  const card = layout?.card ?? null
  return (
    <>
      <svg
        className={style.scrim}
        width={view.width}
        height={view.height}
        aria-hidden="true"
        data-closing={closing || undefined}
        data-testid="fv-tour-scrim"
      >
        <path
          fillRule="evenodd"
          d={`M0 0H${view.width}V${view.height}H0Z${(layout?.holes ?? []).map((h) => roundedRect(h, HOLE_RADIUS)).join("")}`}
        />
      </svg>
      {layout?.hand != null && <GhostHand {...layout.hand} />}
      <Callout
        ref={cardRef}
        x={card?.x ?? 0}
        y={card?.y ?? 0}
        width={TOUR_CARD.width}
        tone="accent"
        caret={card?.caret ?? { side: "left", at: 0 }}
        className={card === null ? `${style.card} ${style.unplaced}` : style.card}
        glide={settled}
        closing={closing}
        role="dialog"
        labelledBy={`${id}-title`}
        tabIndex={-1}
        testId="fv-tour"
      >
        <div className={style.progress} data-step={step}>
          {TOUR_STEPS.map((n) => (
            <span key={n} className={style.dot} data-on={n <= step || undefined} />
          ))}
          <span className={style.step_label}>{TOUR.stepLabel(step, TOUR_STEPS.length)}</span>
        </div>
        <h2 id={`${id}-title`} className={style.title}>
          {TOUR.steps[step].title}
        </h2>
        <p className={style.body}>
          <Phrases words phrases={body} />
        </p>
        <StepActions key={step} last={last} onNext={onNext} onEnd={onEnd} buttonRef={primaryRef} />
      </Callout>
    </>
  )
}
