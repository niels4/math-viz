import type { CSSProperties } from "react"

import { MathText } from "#src/components/ui/MathText.tsx"

import type { EquationToken } from "../math/equation.ts"

import style from "./EquationTokens.module.css"

// Spacing as figma0's fvRender sets it: each space around a token becomes
// 0.3 em of margin, and a token of spaces alone a 0.22 em gap per space.
const SPACE_EM = 0.3
const GAP_EM = 0.22

function Text({ text }: { text: string }) {
  const core = text.trim()
  if (core === "") {
    return <span className={style.gap} style={{ width: `${GAP_EM * text.length}em` }} />
  }
  const lead = text.length - text.trimStart().length
  const trail = text.length - text.trimEnd().length
  const spacing: CSSProperties = {
    ...(lead > 0 ? { marginInlineStart: `${SPACE_EM * lead}em` } : {}),
    ...(trail > 0 ? { marginInlineEnd: `${SPACE_EM * trail}em` } : {}),
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
          <span className={style.num}>
            <EquationTokens tokens={token.num} />
          </span>
          <span className={style.den}>
            <EquationTokens tokens={token.den} />
          </span>
        </span>
      )
    case "sup":
      return <sup className={style.sup}>{token.text}</sup>
    case "paren":
      return <span className={token.big ? style.paren_big : undefined}>{token.text}</span>
  }
}

// Sets equation tokens (math/equation.ts) as maths in plain inline flow, so
// exponents stay raised; a fraction is a self-contained stack and the
// parentheses grow around it. Each parameter's term is a span with
// data-param, where plates, drags and tips attach. The caller sets the font.
export function EquationTokens({ tokens }: { tokens: readonly EquationToken[] }) {
  return tokens.map((token, i) => <Token key={i} token={token} />)
}
