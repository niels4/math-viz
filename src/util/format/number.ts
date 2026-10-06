// The one number rule (figma0 FV · Recommended › Specs › Numbers, ported from
// prelude-fv.js fvNum / fvNumParts / fvNumShort). Fields, equation terms,
// readouts, labels and tags all print through here, so one value always
// reads as one string wherever it shows.

/** Mathematical minus (U+2212), never the keyboard hyphen. */
export const MINUS = "−"

/** Almost equal to (U+2248): the shipped fonts get it from the symbols subsets. */
export const APPROX = "≈"

/** Decimal places shown by default, and after a fine (×0.1) drag. */
export const DISPLAY_DP = 2
export const FINE_DP = 3

export type Relation = "=" | typeof APPROX

export type NumberParts =
  | { kind: "fixed"; text: string; exact: boolean }
  | { kind: "sci"; mantissa: string; exponent: string; exact: false }

const withSign = (negative: boolean, digits: string): string => (negative ? MINUS + digits : digits)

// Moves the decimal point through the exponent instead of multiplying, so
// 1.005 rounds to 1.01 (1.005 * 100 is 100.49999…).
const shiftDecimal = (n: number, by: number): number => {
  const [mantissa = "0", exponent = "0"] = String(n).split("e")
  return Number(`${mantissa}e${Number(exponent) + by}`)
}

/** Rounds half away from zero at `dp` decimals: −0.125 and 0.125 both keep their 3. */
export const roundTo = (v: number, dp: number): number => {
  if (!Number.isFinite(v) || v === 0) {
    return v
  }
  return Math.sign(v) * shiftDecimal(Math.round(shiftDecimal(Math.abs(v), dp)), -dp)
}

/**
 * Snaps to a multiple of `step` without float noise (0.1 + 0.2 at 0.01 is 0.3),
 * ties away from zero like `roundTo`, so a value and its negative snap alike.
 */
export const quantize = (v: number, step: number): number =>
  Number((Math.sign(v) * Math.round(Math.abs(v) / step) * step).toPrecision(12))

/** `dp` decimals, trailing zeros stripped, U+2212 for negatives, never −0. */
export const formatNumber = (v: number, dp: number = DISPLAY_DP): string => {
  const rounded = roundTo(v, dp)
  if (rounded === 0) {
    return "0"
  }
  let digits = Math.abs(rounded).toFixed(dp)
  if (digits.includes(".")) {
    digits = digits.replace(/0+$/, "").replace(/\.$/, "")
  }
  return withSign(rounded < 0, digits)
}

/**
 * A stored value printed whole. Drags store values on 0.01 (0.001 after a
 * fine drag) and typing keeps up to 3 decimals, so 3 dp with zeros stripped
 * prints every digit the value has: stored = shown. Parameter fields, terms
 * and ruler values print through here.
 */
export const formatStored = (v: number): string => formatNumber(v, FINE_DP)

/**
 * Typed text back to a number: what a value field accepts. Either minus
 * (U+2212 as printed, or the keyboard's hyphen), no other text; null when
 * the text is not one finite number ("", "1.0.4", "Infinity").
 */
export const parseNumber = (text: string): number | null => {
  const s = text.trim().replaceAll(MINUS, "-")
  if (s === "" || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) {
    return null
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const formatInteger = (n: number): string => withSign(n < 0, String(Math.abs(n)))

/**
 * How a readout prints a value: fixed at 2 dp for 0.01 ≤ |v| < 100000, two
 * significant figures down to 0.0001, scientific outside that (the exponent
 * is set raised by the caller; the fonts only have ¹²³ as superscripts).
 */
export const numberParts = (v: number): NumberParts => {
  if (!Number.isFinite(v)) {
    return { kind: "fixed", text: "–", exact: false }
  }
  const a = Math.abs(v)
  if (a === 0) {
    return { kind: "fixed", text: "0", exact: true }
  }
  if (a >= 0.01 && a < 1e5) {
    return { kind: "fixed", text: formatNumber(v), exact: Math.abs(roundTo(v, DISPLAY_DP) - v) < 1e-9 }
  }
  if (a >= 1e-4 && a < 0.01) {
    const rounded = Number(v.toPrecision(2))
    return {
      kind: "fixed",
      text: withSign(rounded < 0, String(Math.abs(rounded))),
      exact: Math.abs(rounded - v) < 1e-12,
    }
  }
  let exponent = Math.floor(Math.log10(a))
  let mantissa = roundTo(v / 10 ** exponent, DISPLAY_DP)
  // 9.999e-5 rounds its mantissa up to 10: renormalise to 1 × 10⁻⁴.
  if (Math.abs(mantissa) >= 10) {
    exponent += 1
    mantissa = roundTo(v / 10 ** exponent, DISPLAY_DP)
  }
  return { kind: "sci", mantissa: formatNumber(mantissa), exponent: formatInteger(exponent), exact: false }
}

/** `=` when the readout shows the value exactly, `≈` when it shows a rounding. */
export const relation = (v: number): Relation => (numberParts(v).exact ? "=" : APPROX)

/**
 * Labels, tags and markers: the readout rule without a raised exponent
 * (no room for one), so huge values print whole and tiny ones as ≈0.
 */
export const formatShort = (v: number): string => {
  const parts = numberParts(v)
  if (parts.kind === "fixed") {
    return parts.text
  }
  return Math.abs(v) >= 1 ? formatNumber(v) : `${APPROX}0`
}
