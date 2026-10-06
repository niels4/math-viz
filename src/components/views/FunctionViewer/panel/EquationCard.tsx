import type { BaseFunctionSlug } from "../math/baseFunctions.ts"
import type { TransformParams } from "../math/form.ts"

import { FORM_LABEL } from "../copy.ts"
import { describeEquation, equationTokens } from "../math/equation.ts"
import style from "./EquationCard.module.css"
import { EquationTokens } from "./EquationTokens.tsx"

// The equation under the picker: the live line prints the values and hides
// what is at its default; the form line prints every letter, a parameter at
// its default as a dashed ghost slot (decision D13). Screen readers get both
// as plain text.
export function EquationCard({ fn, params }: { fn: BaseFunctionSlug; params: TransformParams }) {
  const live = equationTokens(fn, params, "live")
  const form = equationTokens(fn, params, "form")
  return (
    <div className={style.card}>
      <output className={style.live} data-testid="func-readout" aria-label={describeEquation(live)}>
        <span className={style.line} aria-hidden="true">
          <EquationTokens tokens={live} />
        </span>
      </output>
      <p className={style.form_row} data-testid="fv-form">
        <span className={style.form_label}>{FORM_LABEL}</span>
        <span className={style.hidden}>: {describeEquation(form)}</span>
        <span className={style.form} aria-hidden="true">
          <EquationTokens tokens={form} />
        </span>
      </p>
    </div>
  )
}
