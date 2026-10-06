import { useEffect, useId, useMemo, useReducer, useRef } from "react"

import workSansStyles from "#src/style/fonts/work_sans/work_sans.module.css"

import { HintBar } from "../../ui/HintBar.tsx"
import { MathText } from "../../ui/MathText.tsx"
import { SettingsMenu } from "../../ui/SettingsMenu.tsx"
import { ThemeChip } from "../../ui/ThemeChip.tsx"
import { TopBar } from "../../ui/TopBar.tsx"
import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { PLANE_KEY_HELP, SECTIONS, VIEW_SUBTITLE, VIEW_TITLE } from "./copy.ts"
import style from "./FunctionViewer.module.css"
import { GhostToggle } from "./GhostToggle.tsx"
import { hintContext, hintFor } from "./model/hints.ts"
import { fvReducer } from "./model/reducer.ts"
import {
  active,
  activeParams,
  curveAt,
  draggedParams,
  handleHeld,
  handleLit,
  isTransformed,
  partUi,
  pLit,
  pMoved,
  pOffView,
} from "./model/selectors.ts"
import { initialFvState, type FvPart, type FvPlaneMark, type PartEvents } from "./model/state.ts"
import { EquationCard } from "./panel/EquationCard.tsx"
import { FunctionPicker } from "./panel/FunctionPicker.tsx"
import { PanelSection } from "./panel/PanelSection.tsx"
import { PCard, QCard } from "./panel/PointCards.tsx"
import { TransformExplainer } from "./panel/TransformExplainer.tsx"
import { TransformGrid } from "./panel/TransformGrid.tsx"
import { useTermDrags } from "./panel/useTermDrags.ts"
import { buildPlaneScene } from "./planeScene.ts"

/** FV 07: [ and ] move P along the curve by 0.1. */
const P_KEY_STEP = 0.1

/** FV 04: P's ghost and "moved ±…" clear this long after a transform's drag lets go. */
const P_GHOST_LINGER_MS = 600

const PLANE_MARKS: readonly string[] = ["p", "anchor", "stretch"] satisfies FvPlaneMark[]

const isPlaneMark = (id: string | null): id is FvPlaneMark => id !== null && PLANE_MARKS.includes(id)

const boxOf = (el: Element): { x: number; y: number; w: number; h: number } => {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

export function FunctionViewer() {
  const [state, dispatch] = useReducer(fvReducer, initialFvState)
  const { fn, params, pX, qX, ghostOn } = state
  const pLitNow = pLit(state)
  const activeNow = active(state)
  const gripLit = handleLit(state)
  const gripHeld = handleHeld(state)
  const pWas = state.pBefore !== null && state.pBefore.x === pX ? state.pBefore.y : null
  // Only what the scene shows: a reported view change must not rebuild it.
  const scene = useMemo(
    () =>
      buildPlaneScene({
        fn,
        params,
        pX,
        qX,
        ghostOn,
        pLit: pLitNow,
        active: activeNow,
        handleLit: gripLit,
        handleHeld: gripHeld,
        pWas,
      }),
    [fn, params, pX, qX, ghostOn, pLitNow, activeNow, gripLit, gripHeld, pWas],
  )
  // A transform's drag let go: P's ghost and its "moved" stay a moment.
  const lingering = state.drag === null && state.pBefore !== null
  useEffect(() => {
    if (!lingering) {
      return
    }
    const timer = setTimeout(() => dispatch({ type: "clearPBefore" }), P_GHOST_LINGER_MS)
    return () => clearTimeout(timer)
  }, [lingering])
  const bindTerm = useTermDrags({
    params,
    onChange: (param, value) => dispatch({ type: "setParam", param, value }),
    onDrag: (param, mode) => dispatch({ type: "drag", part: param, mode }),
    onReset: (param) => dispatch({ type: "resetParam", param }),
  })
  // The open explainer (D12): Esc closes it (unless a field took the Esc),
  // and one a tap opened closes on a press anywhere but its chip and itself.
  const panelRef = useRef<HTMLElement | null>(null)
  const explainerId = useId()
  const { explainer } = state
  useEffect(() => {
    if (explainer === null) {
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        dispatch({ type: "escape" })
      }
    }
    const onPress = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(`[data-chip="${explainer.param}"], [data-testid^="fv-explainer-"]`) == null) {
        dispatch({ type: "explain", param: explainer.param, by: "tap", open: false })
      }
    }
    addEventListener("keydown", onKey)
    if (explainer.by === "tap") {
      document.addEventListener("pointerdown", onPress)
    }
    return () => {
      removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPress)
    }
  }, [explainer])
  const locateChip = () => {
    const chip =
      explainer === null ? null : panelRef.current?.querySelector(`[data-chip="${explainer.param}"]`)
    return chip == null || panelRef.current === null
      ? null
      : { chip: boxOf(chip), panel: boxOf(panelRef.current) }
  }
  // Each panel part reports its hover, focus, drag and edit as its own actions.
  const eventsOf = (part: FvPart): PartEvents => ({
    onHover: (on) => dispatch({ type: "hover", part, on }),
    onFocus: (on) => dispatch({ type: "focus", part, on }),
    onDrag: (mode) => dispatch({ type: "drag", part, mode }),
    onEdit: (edit) => dispatch({ type: "edit", part, edit }),
  })

  return (
    <div className={`${style.page} ${workSansStyles.font}`}>
      <TopBar
        className={style.topbar}
        title={VIEW_TITLE}
        subtitle={VIEW_SUBTITLE}
        actions={
          <>
            <ThemeChip />
            <SettingsMenu />
          </>
        }
      />
      <aside ref={panelRef} className={style.panel}>
        <PanelSection {...SECTIONS.function}>
          <FunctionPicker value={fn} onChange={(next) => dispatch({ type: "setFunction", fn: next })} />
          <EquationCard
            fn={fn}
            params={params}
            lit={activeParams(state)}
            keep={draggedParams(state)}
            tip={state.hover === "eq" ? state.eqOver : null}
            onPointer={(over) => dispatch({ type: "eqPointer", over })}
            onLeave={() => dispatch({ type: "hover", part: "eq", on: false })}
            bindTerm={bindTerm}
          />
        </PanelSection>
        <TransformGrid
          params={params}
          uiOf={(param) => partUi(state, param)}
          eventsOf={eventsOf}
          onChange={(param, value) => dispatch({ type: "setParam", param, value })}
          onReset={(param) => dispatch({ type: "resetParam", param })}
          onResetAll={() => dispatch({ type: "resetAll" })}
          onFlip={(param) => dispatch({ type: "flip", param })}
          onExplain={(param, by, open) => dispatch({ type: "explain", param, by, open })}
          explaining={explainer === null ? null : { param: explainer.param, id: explainerId }}
        />
        <PanelSection {...SECTIONS.points}>
          <PCard
            x={pX}
            y={curveAt(state, pX)}
            extent={state.view?.extent ?? null}
            off={pOffView(state)}
            moved={pMoved(state)}
            ui={partUi(state, "p")}
            events={eventsOf("p")}
            onChange={(x) => dispatch({ type: "setP", x })}
          />
          <QCard x={qX} y={qX === null ? null : curveAt(state, qX)} />
        </PanelSection>
        <div className={style.spacer} />
        <HintBar className={style.hint} hint={hintFor(hintContext(state))} testId="fv-hint" />
        <div className={style.tail} />
      </aside>
      {explainer !== null && (
        <TransformExplainer
          key={explainer.param}
          param={explainer.param}
          id={explainerId}
          locate={locateChip}
        />
      )}
      <main className={style.plane}>
        <CartesianPlane
          scene={scene}
          caption={<MathText text="y = f(x)" />}
          tools={
            isTransformed(state) && (
              <GhostToggle fn={fn} on={ghostOn} onChange={(on) => dispatch({ type: "setGhost", on })} />
            )
          }
          keyHelp={PLANE_KEY_HELP}
          onViewChange={(view) => dispatch({ type: "setView", view })}
          onPointer={(pointer) =>
            dispatch(
              pointer === null
                ? { type: "planePointer", x: null }
                : {
                    type: "planePointer",
                    x: pointer.x,
                    ...(isPlaneMark(pointer.over) && { over: pointer.over }),
                    panning: pointer.panning,
                  },
            )
          }
          onMarkDrag={(phase, id, to) => {
            if (!isPlaneMark(id)) {
              return
            }
            // P's x follows the pointer along the curve; a handle sets its
            // two values (D21). The panel and the hint read each drag as
            // its part's.
            if (phase !== "move") {
              dispatch({ type: "drag", part: id, mode: phase === "start" ? "coarse" : null })
            } else if (id === "p") {
              dispatch({ type: "setP", x: to.x })
            } else {
              dispatch({ type: "dragHandle", handle: id, to })
            }
          }}
          onKeyDown={(e) => {
            const step = e.key === "[" ? -P_KEY_STEP : e.key === "]" ? P_KEY_STEP : 0
            if (step === 0 || e.ctrlKey || e.metaKey || e.altKey) {
              return false
            }
            dispatch({ type: "setP", x: pX + step })
            return true
          }}
        />
      </main>
    </div>
  )
}
