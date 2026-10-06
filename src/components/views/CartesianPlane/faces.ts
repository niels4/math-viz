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

type Metrics = Pick<CanvasFace, "ascent" | "descent" | "lineGap">

const STIX_FAMILY = `"STIX Two Text", Georgia, "Times New Roman", serif`
const MONO_FAMILY = `"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace`

const STIX_METRICS: Metrics = { ascent: 0.762, descent: 0.238, lineGap: 0.25 }
const MONO_METRICS: Metrics = { ascent: 2146 / 2048, descent: 555 / 2048, lineGap: 0 }

/** A face in one of the vendored families, named by a CSS font-family list (a theme's `--sig-readout-font`). */
export const makeFace = (style: string, size: number, family: string): CanvasFace => ({
  font: `${style} ${size}px ${family}`,
  size,
  ...(/^\s*["']?STIX/.test(family) ? STIX_METRICS : MONO_METRICS),
})

/** Tick labels: the numeric role (Roboto Mono 500), 14 px. */
export const TICK_LABEL_FACE: CanvasFace = makeFace("500", 14, MONO_FAMILY)

/** The origin's O: the maths role (STIX Two Text italic), 15 px. */
export const ORIGIN_FACE: CanvasFace = makeFace("italic 400", 15, STIX_FAMILY)

/** A point's letter on its label (point-label-fv): STIX italic 20. */
export const LABEL_LETTER_FACE: CanvasFace = makeFace("italic 400", 20, STIX_FAMILY)

/** A point's letter on its edge marker (edge-marker-fv): STIX italic 18. */
export const EDGE_LETTER_FACE: CanvasFace = makeFace("italic 400", 18, STIX_FAMILY)

/** The faces whose family is the theme's readout font: label coordinates 17, tag values and edge-marker coordinates 15. */
export type ReadoutFaces = { label: CanvasFace; small: CanvasFace }

export const readoutFaces = (family: string): ReadoutFaces => ({
  label: makeFace("500", 17, family),
  small: makeFace("500", 15, family),
})

/** Every face the plane draws in, for loading before the first frame: both readout families, as themes pick either. */
export const PLANE_FACES: readonly { face: CanvasFace; text: string }[] = [
  { face: TICK_LABEL_FACE, text: "−0123456789.≈" },
  { face: ORIGIN_FACE, text: "O" },
  { face: LABEL_LETTER_FACE, text: "PQ" },
  ...[MONO_FAMILY, STIX_FAMILY].map((family) => ({
    face: readoutFaces(family).label,
    text: "(−0123456789.,)≈",
  })),
]

/** Height of the face's AUTO line box. */
export const lineBox = (face: CanvasFace): number => face.size * (face.ascent + face.descent + face.lineGap)

/** Figma's text box height: the AUTO line box rounded to whole px (STIX 20 → 25, Roboto Mono 17 → 22). */
export const textBoxHeight = (face: CanvasFace): number => Math.round(lineBox(face))

/** Baseline offset below the top of the line box. */
export const baselineBelowTop = (face: CanvasFace): number => face.size * (face.lineGap / 2 + face.ascent)
