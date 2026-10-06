// The one number rule (figma0 FV · Recommended › Specs › Numbers, ported from
// prelude-fv.js fvNum / fvNumParts, with the user's fixed-decimals ruling of
// 2026-10-06, plan M10b, in place of its "strip zeros"). Every value a view
// shows prints a fixed number of decimals, so the decimal point holds still
// while it slides: fields, equation terms, readouts, labels, tags, badges and
// plates all print through here, and one value always reads as one string
// wherever it shows. Scale marks (tick and ruler labels, the zoom, the scale
// bar) keep the short form, zeros stripped.

/** Mathematical minus (U+2212), never the keyboard hyphen. */
export const MINUS = "−"

/** Almost equal to (U+2248): the shipped fonts get it from the symbols subsets. */
export const APPROX = "≈"

/** Decimal places every value shows, and the places a fine drag shows (held for the whole drag). */
export const DISPLAY_DP = 2
export const FINE_DP = 3

/** Readouts go scientific from here up: fixed digits would outgrow their cards. */
const SCIENTIFIC_FROM = 1e5

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

/**
 * A value: exactly `dp` decimals, U+2212 for negatives, never −0 (what
 * rounds to 0 prints 0.00).
 */
export const formatNumber = (v: number, dp: number = DISPLAY_DP): string => {
  const rounded = roundTo(v, dp)
  return withSign(rounded < 0, Math.abs(rounded).toFixed(dp))
}

/**
 * The decimals a stored value (a, b, h, k) shows: 3 when it has a third (a
 * fine drag's, or typed) or while a fine drag holds it (`fine`), so its
 * precision never changes mid-drag; else 2. Drags store values on 0.01
 * (0.001 when fine) and typing keeps up to 3 decimals: stored = shown.
 */
export const storedDp = (v: number, fine = false): number =>
  fine || roundTo(v, DISPLAY_DP) !== roundTo(v, FINE_DP) ? FINE_DP : DISPLAY_DP

/** A stored value at its decimals (`storedDp`). */
export const formatStored = (v: number, fine = false): string => formatNumber(v, storedDp(v, fine))

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
 * How a readout prints a value: 2 decimals below 100000, a value too small
 * for them as 0.00 (≈ says it is rounded); scientific from 100000 up, the
 * mantissa at 2 decimals (the exponent is set raised by the caller; the
 * fonts only have ¹²³ as superscripts).
 */
export const numberParts = (v: number): NumberParts => {
  if (!Number.isFinite(v)) {
    return { kind: "fixed", text: "–", exact: false }
  }
  if (Math.abs(roundTo(v, DISPLAY_DP)) < SCIENTIFIC_FROM) {
    return { kind: "fixed", text: formatNumber(v), exact: Math.abs(roundTo(v, DISPLAY_DP) - v) < 1e-9 }
  }
  let exponent = Math.floor(Math.log10(Math.abs(v)))
  let mantissa = roundTo(v / 10 ** exponent, DISPLAY_DP)
  // 9.999e7 rounds its mantissa up to 10: renormalise to 1.00 × 10⁸.
  if (Math.abs(mantissa) >= 10) {
    exponent += 1
    mantissa = roundTo(v / 10 ** exponent, DISPLAY_DP)
  }
  return { kind: "sci", mantissa: formatNumber(mantissa), exponent: formatInteger(exponent), exact: false }
}

/** `=` when the readout shows the value exactly, `≈` when it shows a rounding. */
export const relation = (v: number): Relation => (numberParts(v).exact ? "=" : APPROX)

/**
 * The short form, for numbers that never slide (the ruling leaves them
 * alone): `dp` decimals with trailing zeros stripped. Scale marks, so a
 * ruler reads 0.9 and 1.1, the scale bar 1.25 u, the zoom 80 %; and a
 * constant in copy, such as the default a reset goes back to.
 */
export const formatMark = (v: number, dp: number = DISPLAY_DP): string => {
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
 * A tick label (the plane's axes, the P scrubber): the short form, with two
 * significant figures below 0.01 so a deep zoom's ticks stay apart, and ≈0
 * below 0.0001.
 */
export const formatTick = (v: number): string => {
  const a = Math.abs(v)
  if (!Number.isFinite(v) || a === 0 || a >= 0.01) {
    return Number.isFinite(v) ? formatMark(v) : "–"
  }
  if (a < 1e-4) {
    return `${APPROX}0`
  }
  const rounded = Number(v.toPrecision(2))
  return withSign(rounded < 0, String(Math.abs(rounded)))
}
