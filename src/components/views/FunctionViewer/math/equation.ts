import { formatStored, MINUS } from "#src/util/format/number.ts"

import type { BaseFunctionSlug } from "./baseFunctions.ts"

import { INNER_STEPS, isAtDefault, type TransformParam, type TransformParams } from "./form.ts"

// The equation as tokens (port of figma0's fvEqTokens, prelude-fv.js). The
// live line prints values and hides a parameter at its default; the form
// line prints every letter. One renderer (panel/EquationTokens) sets both,
// and `describeEquation` reads the same tokens as plain text for aria.

export type EquationMode = "live" | "form"

export type EquationToken =
  | { kind: "text"; text: string }
  /**
   * One parameter's term, operator included for h and k ("+ 1"), where
   * plates, drags and tips attach. `ghost`: a form letter at its default,
   * a dashed slot unless its parameter is active (decision D13).
   */
  | { kind: "param"; param: TransformParam; text: string; ghost: boolean }
  | { kind: "frac"; num: readonly EquationToken[]; den: readonly EquationToken[] }
  | { kind: "sup"; text: string }
  /** `big`: grown (1.42 em) around a stacked fraction. */
  | { kind: "paren"; text: "(" | ")"; big: boolean }

const text = (s: string): EquationToken => ({ kind: "text", text: s })

const EXPONENT: Partial<Record<BaseFunctionSlug, string>> = { x2: "2", x3: "3" }

// The sign rule: h > 0 prints x − h, h < 0 prints x + |h|; k likewise after the body.
const signed = (v: number, positive: string, negative: string): string =>
  `${v > 0 ? positive : negative} ${formatStored(Math.abs(v))}`

export function equationTokens(
  fn: BaseFunctionSlug,
  params: TransformParams,
  mode: EquationMode,
): EquationToken[] {
  const form = mode === "form"
  const shown = (p: TransformParam) => form || !isAtDefault(params, p)
  const term = (p: TransformParam, s: string): EquationToken => ({
    kind: "param",
    param: p,
    text: s,
    ghost: form && isAtDefault(params, p),
  })

  // The inner input in D1's order (form.ts): "− h" follows the expression so
  // far, "/ b" stacks it over b.
  let inner: EquationToken[] = [text("x")]
  let hasFrac = false
  for (const step of INNER_STEPS) {
    if (!shown(step)) {
      continue
    }
    if (step === "h") {
      const last = inner.at(-1)
      const head =
        last?.kind === "text" ? [...inner.slice(0, -1), text(`${last.text} `)] : [...inner, text(" ")]
      inner = form
        ? [...head, text(" − "), term("h", "h")]
        : [...head, term("h", signed(params.h, MINUS, "+"))]
    } else {
      inner = [{ kind: "frac", num: inner, den: [term("b", form ? "b" : formatStored(params.b))] }]
      hasFrac = true
    }
  }
  const bare = inner.length === 1 && inner[0]?.kind === "text"
  const paren = (s: "(" | ")"): EquationToken => ({ kind: "paren", text: s, big: hasFrac })

  const exponent = EXPONENT[fn]
  let body: EquationToken[]
  if (fn === "sin") {
    body = [text("sin"), paren("("), ...inner, paren(")")]
  } else if (exponent === undefined) {
    body = inner
  } else {
    body = bare
      ? [text("x"), { kind: "sup", text: exponent }]
      : [paren("("), ...inner, paren(")"), { kind: "sup", text: exponent }]
  }

  const tokens: EquationToken[] = [text("f(x) = ")]
  if (shown("a")) {
    tokens.push(term("a", form ? "a" : params.a === -1 ? MINUS : formatStored(params.a)))
    if (fn === "sin") {
      tokens.push(text(" "))
    }
  }
  // A coefficient on a bare linear input needs no parentheses (2x), on a
  // compound one it does: 2(x + 1).
  if (fn === "x" && shown("a") && !bare) {
    tokens.push(paren("("), ...body, paren(")"))
  } else {
    tokens.push(...body)
  }
  if (shown("k")) {
    tokens.push(text(" "), term("k", form ? "+ k" : signed(params.k, "+", MINUS)))
  }
  return tokens
}

const SUPERSCRIPT: Readonly<Record<string, string>> = { "2": "²", "3": "³" }

// A fraction's part keeps its own parentheses once it is more than one term.
const group = (s: string): string => (/[ +−]/.test(s) ? `(${s})` : s)

const plain = (tokens: readonly EquationToken[]): string =>
  tokens
    .map((t) => {
      switch (t.kind) {
        case "frac":
          return `${group(plain(t.num).trim())}/${group(plain(t.den).trim())}`
        case "sup":
          return SUPERSCRIPT[t.text] ?? `^${t.text}`
        default:
          return t.text
      }
    })
    .join("")

/** The tokens as one line of plain text for aria labels: f(x) = 2((x + 1)/2)² + 1. */
export const describeEquation = (tokens: readonly EquationToken[]): string =>
  plain(tokens).replace(/\s+/g, " ").trim()
