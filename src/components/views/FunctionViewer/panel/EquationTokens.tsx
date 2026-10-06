import type { CSSProperties } from "react"

import { MathText } from "#src/components/ui/MathText.tsx"

import type { EquationToken } from "../math/equation.ts"

import style from "./EquationTokens.module.css"

// Spacing as figma0's fvRender sets it, rounded to whole px like its
// frames: each space around a token becomes 0.3 em of margin, and a token
// of spaces alone a 0.22 em gap per space (at least 1 px).
const SPACE_EM = 0.3
const GAP_EM = 0.22

const roundPx = (em: number) => `round(nearest, ${em}em, 1px)`

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

function Token({ token }: { token: EquationToken }) {
  switch (token.kind) {
    case "text":
      return <Text text={token.text} />
    case "param":
      return (
        <span className={style.term} data-param={token.param} data-ghost={token.ghost ? "" : undefined}>
          <MathText text={token.text} />
        </span>
      )
    case "frac":
      return (
        <span className={style.frac}>
          <span className={style.part}>
            <EquationTokens tokens={token.num} />
          </span>
          <span className={style.bar} />
          <span className={style.part}>
            <EquationTokens tokens={token.den} />
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
// data-param (and data-ghost for a form slot at its default), where plates,
// drags and tips attach. The caller sets the font, its size and the line
// height.
export function EquationTokens({ tokens }: { tokens: readonly EquationToken[] }) {
  return tokens.map((token, i) => <Token key={i} token={token} />)
}
