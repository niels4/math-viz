// Canvas text faces. Figma sets text in an AUTO line box: ascent + descent
// + line gap, the gap split above and below. The metrics are the vendored
// fonts' hhea values, so canvas baselines land where the design's boxes put
// them. The faces themselves load from src/style/global.css.

export type CanvasFace = {
  /** A canvas `font` shorthand. */
  font: string
  size: number
  /** hhea metrics in em. */
  ascent: number
  descent: number
  lineGap: number
}

/** Tick labels: the numeric role (Roboto Mono 500), 14 px. */
export const TICK_LABEL_FACE: CanvasFace = {
  font: `500 14px "Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace`,
  size: 14,
  ascent: 2146 / 2048,
  descent: 555 / 2048,
  lineGap: 0,
}

/** The origin's O: the maths role (STIX Two Text italic), 15 px. */
export const ORIGIN_FACE: CanvasFace = {
  font: `italic 400 15px "STIX Two Text", Georgia, "Times New Roman", serif`,
  size: 15,
  ascent: 0.762,
  descent: 0.238,
  lineGap: 0.25,
}

/** Height of the face's AUTO line box. */
export const lineBox = (face: CanvasFace): number => face.size * (face.ascent + face.descent + face.lineGap)

/** Baseline offset below the top of the line box. */
export const baselineBelowTop = (face: CanvasFace): number => face.size * (face.lineGap / 2 + face.ascent)
