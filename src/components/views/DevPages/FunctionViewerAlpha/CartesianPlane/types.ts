export type PlotFunc = {
  xOffset: number
  xScale: number
  yOffset: number
  yScale: number
  func: (x: number) => number
}

// The visible X range in math units: the left and right screen edges mapped
// back through zoom and pan (mirrors ctxTox in drawCartesianPlane). The
// Points p1 slider binds its track to this range.
export type XExtent = {
  minX: number
  maxX: number
}

// The visible frame: zoom is screen px per math unit, pan is the math
// coords of the view center offset (screen y grows downward, hence the
// sign flips where pan meets pixels).
export type ViewState = {
  zoom: number
  panX: number
  panY: number
}

export type DragSample = {
  x: number
  y: number
  t: number
}

export type DragState = {
  lastX: number
  lastY: number
  samples: DragSample[]
}

export type PointerPoint = {
  x: number
  y: number
}

export type PinchState = {
  lastDist: number
  lastMidX: number
  lastMidY: number
}

export type Velocity = {
  vx: number
  vy: number
}
