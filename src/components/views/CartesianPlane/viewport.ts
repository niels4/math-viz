import { formatNumber } from "#src/util/format/number.ts"

import type { ViewState } from "./types.ts"

import { MAX_UNIT_SIZE, MIN_UNIT_SIZE } from "./util.ts"

/** 100 %: 50 px per unit, the plane's default zoom before D17. */
export const BASE_ZOOM = 50

/** The scale bar's fixed length; it measures SCALE_BAR_PX / zoom units. */
export const SCALE_BAR_PX = 50

/** The visible math range: the plane's edges mapped back through zoom and pan. */
export type Extent = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** What the plane reports to its owner after every view change. */
export type PlaneView = {
  zoom: number
  extent: Extent
}

/** One frame's mapping between math units and the plane's CSS pixels. */
export type Viewport = {
  width: number
  height: number
  /** px per unit */
  zoom: number
  /** Screen position of the math origin. */
  originX: number
  originY: number
}

// Pan is the math offset of the view centre (screen y grows down, hence the
// sign flip on y). The origin lands on whole device pixels, so grid lines a
// whole number of pixels apart keep one subpixel phase while panning (no
// shimmer), and the default view draws where the design's export does.
export const makeViewport = (
  size: { width: number; height: number; dpr: number },
  { zoom, panX, panY }: ViewState,
): Viewport => {
  const snap = (v: number) => Math.round(v * size.dpr) / size.dpr
  return {
    width: size.width,
    height: size.height,
    zoom,
    originX: snap(Math.floor(size.width / 2) + panX * zoom),
    originY: snap(Math.floor(size.height / 2) - panY * zoom),
  }
}

export const toScreenX = (vp: Viewport, x: number): number => vp.originX + x * vp.zoom
export const toScreenY = (vp: Viewport, y: number): number => vp.originY - y * vp.zoom
export const toMathX = (vp: Viewport, px: number): number => (px - vp.originX) / vp.zoom
export const toMathY = (vp: Viewport, py: number): number => (vp.originY - py) / vp.zoom

export const visibleExtent = (vp: Viewport): Extent => ({
  minX: toMathX(vp, 0),
  maxX: toMathX(vp, vp.width),
  minY: toMathY(vp, vp.height),
  maxY: toMathY(vp, 0),
})

/** The viewport behind a reported view: an owner's maps for the plane as last drawn. */
export const viewportOf = ({ zoom, extent }: PlaneView): Viewport => ({
  width: (extent.maxX - extent.minX) * zoom,
  height: (extent.maxY - extent.minY) * zoom,
  zoom,
  originX: -extent.minX * zoom,
  originY: extent.maxY * zoom,
})

/**
 * The pan that brings an off-view point in: along each axis it lies past,
 * it lands a quarter of the plane in from that edge, so its label has room.
 * An axis it is within keeps its pan.
 */
export const panIntoView = (
  vp: Viewport,
  pan: { panX: number; panY: number },
  point: { x: number; y: number },
): { panX: number; panY: number } => {
  const sx = toScreenX(vp, point.x)
  const sy = toScreenY(vp, point.y)
  const towards = (s: number, size: number): number =>
    s < 0 ? size / 4 - s : s > size ? (size * 3) / 4 - s : 0
  // Screen x follows panX; screen y moves against panY.
  return {
    panX: pan.panX + towards(sx, vp.width) / vp.zoom,
    panY: pan.panY - towards(sy, vp.height) / vp.zoom,
  }
}

/** The zoom as a percentage: 100 % = BASE_ZOOM. */
export const zoomPercent = (zoom: number): number => (zoom / BASE_ZOOM) * 100

/** The zoom control's readout: whole percent, one decimal below 10 % (6.3 %, 0.5 %). */
export const zoomLabel = (zoom: number): string => {
  const percent = zoomPercent(zoom)
  return `${formatNumber(percent, percent < 10 ? 1 : 0)}%`
}

const clean = (v: number): number => Number(v.toPrecision(12))

// The R10 preferred numbers per decade (…, 80, 100, 125, 160, 200 %): the
// stops the v2 chrome documents (1.00×, 1.60×, 2.50×) and R9's 80 %, so the
// zoom control and the scale bar read calibrated values.
const R10 = [1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8] as const

/** Zoom stops in px per unit, ascending, from 0.5 % to 200 % (the gesture limits). */
export const ZOOM_STOPS: readonly number[] = [-1, 0, 1, 2]
  .flatMap((decade) => R10.map((m) => clean((m * 10 ** decade * BASE_ZOOM) / 100)))
  .filter((zoom) => zoom >= MIN_UNIT_SIZE && zoom <= MAX_UNIT_SIZE)

const STOP_TOLERANCE = 1e-3

/** The next stop above (1) or below (−1) the zoom; the zoom itself at the limits. */
export const stepZoom = (zoom: number, direction: 1 | -1): number => {
  const next =
    direction > 0
      ? ZOOM_STOPS.find((stop) => stop > zoom * (1 + STOP_TOLERANCE))
      : ZOOM_STOPS.findLast((stop) => stop < zoom * (1 - STOP_TOLERANCE))
  return next ?? zoom
}

/**
 * Decision D17: the default zoom keeps y ∈ [−fit, fit] in view. It is the
 * largest stop that fits, at most 100 %: 50 px per unit on a 792 px plane,
 * 40 px (80 %) on R9's 408 px dock plane.
 */
export const defaultZoom = (height: number, fitHalfRangeY: number): number => {
  if (height <= 0 || fitHalfRangeY <= 0) {
    return BASE_ZOOM
  }
  const fit = Math.min(BASE_ZOOM, height / (2 * fitHalfRangeY))
  return ZOOM_STOPS.findLast((stop) => stop <= fit * (1 + 1e-9)) ?? MIN_UNIT_SIZE
}

/** Units the 50 px scale bar measures at this zoom: 1 at 100 %, 1.25 at 80 %. */
export const scaleBarUnits = (zoom: number): number => SCALE_BAR_PX / zoom

/** The scale bar's label: "1 u", "1.25 u". */
export const scaleLabel = (zoom: number): string => `${formatNumber(scaleBarUnits(zoom))} u`
