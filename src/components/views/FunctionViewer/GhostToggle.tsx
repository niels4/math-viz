import { MathText } from "#src/components/ui/MathText.tsx"
import stixStyles from "#src/style/fonts/stix_two_text/stix_two_text.module.css"

import { ORIGINAL_LABEL, originalMath } from "./copy.ts"
import style from "./GhostToggle.module.css"
import { BASE_FUNCTIONS, type BaseFunctionSlug } from "./math/baseFunctions.ts"

// ghost-toggle-fv, in the plane's tools: the switch for the dashed original
// and its legend, its swatch the ghost's own dashed line. The view shows it
// only while a transform is set (D7), when there is a ghost to show.
export function GhostToggle({
  fn,
  on,
  onChange,
}: {
  fn: BaseFunctionSlug
  on: boolean
  onChange: (on: boolean) => void
}) {
  const base = BASE_FUNCTIONS[fn]
  return (
    <button
      type="button"
      className={style.toggle}
      aria-pressed={on}
      aria-label={`${ORIGINAL_LABEL}, ${originalMath(base.spoken)}`}
      onClick={() => onChange(!on)}
      data-testid="fv-ghost-toggle"
    >
      <svg className={style.swatch} width={22} height={4} aria-hidden="true">
        <path d="M0 2H22" />
      </svg>
      <span className={style.label}>{ORIGINAL_LABEL}</span>
      <span className={`${style.math} ${stixStyles.font}`}>
        <MathText text={originalMath(base.label)} />
      </span>
    </button>
  )
}
