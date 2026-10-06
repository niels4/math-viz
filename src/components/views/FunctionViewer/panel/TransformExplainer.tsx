import { useEffectEvent, useLayoutEffect, useRef, useState } from "react"

import { Callout } from "#src/components/ui/Callout.tsx"
import { MathText } from "#src/components/ui/MathText.tsx"
import { Phrases } from "#src/components/ui/Phrases.tsx"

import type { Rect } from "../../CartesianPlane/rect.ts"

import { MiniPlane } from "../../CartesianPlane/MiniPlane.tsx"
import {
  EXPLAINERS,
  explainerGestures,
  GROUP_MATH,
  IN_THE_EQUATION,
  PARAM_NAMES,
  TRANSFORM_GROUPS,
} from "../copy.ts"
import { snippetTokens } from "../math/equation.ts"
import { DEFAULT_PARAMS, isScale, type TransformParam } from "../math/form.ts"
import { EquationTokens } from "./EquationTokens.tsx"
import { EXPLAINER_LAYOUT, placeExplainer, type ExplainerPlace } from "./explainer.ts"
import { EXPLAINER_EXAMPLE, EXPLAINER_PLOT_SIZE, EXPLAINER_PLOTS } from "./explainerPlots.ts"
import style from "./TransformExplainer.module.css"

const where = (param: TransformParam): string =>
  TRANSFORM_GROUPS.find((group) => (group.params as readonly TransformParam[]).includes(param))?.where ?? ""

// help-popover-fv (decisions D10, D12; R7): what a transform does. Its
// letter and name, inside or outside f( ), one sentence, a picture of the
// value at 2 on x² (the original dashed, one point carried), its place in
// the form with its letter lit, and its ruler's gestures. A non-modal
// dialog beside the panel, its caret on the letter chip; the view says when
// it opens and closes. `locate` gives the chip's and the panel's boxes.
export function TransformExplainer({
  param,
  id,
  locate,
}: {
  param: TransformParam
  id: string
  locate: () => { chip: Rect; panel: Rect } | null
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [place, setPlace] = useState<ExplainerPlace | null>(null)
  const update = useEffectEvent(() => {
    const at = locate()
    const card = ref.current
    if (at !== null && card !== null) {
      setPlace(
        placeExplainer(at.chip, at.panel, card.offsetHeight, { width: innerWidth, height: innerHeight }),
      )
    }
  })
  // Placed before it paints, and kept beside its chip as the window or
  // the panel moves (the owner keys it by parameter).
  useLayoutEffect(() => {
    update()
    const follow = () => update()
    addEventListener("resize", follow)
    addEventListener("scroll", follow, true)
    return () => {
      removeEventListener("resize", follow)
      removeEventListener("scroll", follow, true)
    }
  }, [])

  const { say, snippet } = EXPLAINERS[param]
  const scale = isScale(param)
  return (
    <Callout
      ref={ref}
      x={place?.x ?? 0}
      y={place?.y ?? 0}
      width={EXPLAINER_LAYOUT.width}
      tone="plain"
      caret={place?.caret ?? { side: "left", at: EXPLAINER_LAYOUT.tip }}
      className={place === null ? `${style.explainer} ${style.unplaced}` : style.explainer}
      role="dialog"
      labelledBy={`${id}-name`}
      testId={`fv-explainer-${param}`}
    >
      <div className={style.head}>
        <span className={style.chip} aria-hidden="true">
          <MathText text={param} />
        </span>
        <span id={`${id}-name`} className={style.name}>
          {PARAM_NAMES[param].name}
        </span>
        <span className={style.where}>
          {where(param)}
          <span className={style.where_math}>
            <MathText text={GROUP_MATH} />
          </span>
        </span>
      </div>
      <p id={id} className={style.sentence}>
        {say}
      </p>
      <MiniPlane
        className={style.plot}
        width={EXPLAINER_PLOT_SIZE.width}
        height={EXPLAINER_PLOT_SIZE.height}
        plot={EXPLAINER_PLOTS[param]}
      >
        <span className={style.example} aria-hidden="true">
          <span>
            <MathText text={param} />
          </span>
          <span>= {EXPLAINER_EXAMPLE.value}</span>
        </span>
      </MiniPlane>
      <p className={style.snippet_row}>
        <span className={style.snippet_label}>{IN_THE_EQUATION}</span>
        <span className={style.snippet}>
          <EquationTokens tokens={snippetTokens(param, snippet)} lit={[param]} />
        </span>
      </p>
      <hr className={style.rule} />
      <p className={style.gestures}>
        <Phrases words phrases={explainerGestures(scale, DEFAULT_PARAMS[param])} />
      </p>
    </Callout>
  )
}
