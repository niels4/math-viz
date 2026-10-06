import type { CSSProperties, HTMLAttributes, ReactNode } from "react"

import { MathText } from "#src/components/ui/MathText.tsx"

import type { EquationToken } from "../math/equation.ts"
import type { TransformParam } from "../math/form.ts"

import style from "./EquationTokens.module.css"

// Spacing as figma0's fvRender sets it, rounded to whole px like its
// frames: each space around a token becomes 0.3 em of margin, and a token
// of spaces alone a 0.22 em gap per space (at least 1 px).
const SPACE_EM = 0.3
const GAP_EM = 0.22

const roundPx = (em: number) => `round(nearest, ${em}em, 1px)`

/** What the owner adds to the terms: which are lit, what a term does, and what hangs under one. */
export type TermOptions = {
  /** The parameters lit as partners of the active value (FV 04): their terms take the plate. */
  lit?: readonly TransformParam[]
  /** Attributes and handlers for a parameter's term (a drag, a double-click). */
  bindTerm?: (param: TransformParam) => HTMLAttributes<HTMLSpanElement>
  /** Under a parameter's term, e.g. its tip (term-tip-fv). */
  renderUnder?: (param: TransformParam) => ReactNode
}

function Text({ text }: { text: string }) {
  const core = text.trim()
  if (core === "") {
    return <span className={style.gap} style={{ width: `max(1px, ${roundPx(GAP_EM * text.length)})` }} />
  }
  const lead = text.length - text.trimStart().length
  const trail = text.length - text.trimEnd().length
  const spacing: CSSProperties = {
    ...(lead > 0 ? { marginInlineStart: roundPx(SPACE_EM * lead) } : {}),
    ...(trail > 0 ? { marginInlineEnd: roundPx(SPACE_EM * trail) } : {}),
  }
  return (
    <span style={spacing}>
      <MathText text={core} />
    </span>
  )
}

function Token({ token, options }: { token: EquationToken; options: TermOptions }) {
  switch (token.kind) {
    case "text":
      return <Text text={token.text} />
    case "param":
      return (
        <span
          className={style.term}
          {...options.bindTerm?.(token.param)}
          data-param={token.param}
          data-ghost={token.ghost ? "" : undefined}
          data-lit={options.lit?.includes(token.param) === true ? "" : undefined}
        >
          <MathText text={token.text} />
          {options.renderUnder?.(token.param)}
        </span>
      )
    case "frac":
      return (
        <span className={style.frac}>
          <span className={style.part}>
            <EquationTokens tokens={token.num} {...options} />
          </span>
          <span className={style.bar} />
          <span className={style.part}>
            <EquationTokens tokens={token.den} {...options} />
          </span>
        </span>
      )
    case "sup":
      return <sup className={style.sup}>{token.text}</sup>
    case "paren":
      return <span className={token.big ? style.paren_big : style.paren}>{token.text}</span>
  }
}

// Sets equation tokens (math/equation.ts) as maths in plain inline flow, so
// every part shares one baseline; a fraction is a self-contained stack and
// the parentheses grow around it. Each parameter's term is a span with
// data-param (data-ghost for a form slot at its default, data-lit while its
// value is active), where the owner binds drags and hangs tips. The caller
// sets the font, its size and the line height.
export function EquationTokens({ tokens, ...options }: { tokens: readonly EquationToken[] } & TermOptions) {
  return tokens.map((token, i) => <Token key={i} token={token} options={options} />)
}
