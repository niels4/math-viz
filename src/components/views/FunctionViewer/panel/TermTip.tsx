import { MathText } from "#src/components/ui/MathText.tsx"
import { formatStored } from "#src/util/format/number.ts"

import type { TransformParam } from "../math/form.ts"

import { PARAM_NAMES } from "../copy.ts"
import style from "./TermTip.module.css"

// term-tip-fv: under a hovered term, its parameter's value and name
// ("h = −1.00 · horizontal shift"), so a term that reads "+ 1.00" says which
// value it is. Inverted (--foreground plate, --background text), a caret up at
// the term, centred on it. Decorative: the term's control carries the name.
export function TermTip({ param, value, fine }: { param: TransformParam; value: number; fine: boolean }) {
  return (
    <span className={style.tip} aria-hidden="true" data-testid={`fv-term-tip-${param}`}>
      <span className={style.caret} />
      <span className={style.body}>
        <span className={style.math}>
          <MathText text={param} />
        </span>
        <span className={style.math}>= {formatStored(value, fine)}</span>
        <span className={style.name}>· {PARAM_NAMES[param].name.toLowerCase()}</span>
      </span>
    </span>
  )
}
