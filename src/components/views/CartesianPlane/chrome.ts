// Geometry of the chrome's HUD ticks (canvas-chrome-v2): a tick every 40 px
// along each edge, 4 px in, 6 px long and 12 px every 200 px.

const HUD_STEP = 40
const HUD_LONG_EVERY = 200
const HUD_INSET = 4
const HUD_SHORT = 6
const HUD_LONG = 12
/** No tick within this distance of the far corner. */
const HUD_END_CLEAR = 30

/** The ticks as one SVG path for a plane of this size. */
export const hudTicks = (width: number, height: number): string => {
  const parts: string[] = []
  for (let x = HUD_STEP; x < width - HUD_END_CLEAR; x += HUD_STEP) {
    const len = x % HUD_LONG_EVERY === 0 ? HUD_LONG : HUD_SHORT
    parts.push(`M${x} ${HUD_INSET}v${len}`, `M${x} ${height - HUD_INSET - len}v${len}`)
  }
  for (let y = HUD_STEP; y < height - HUD_END_CLEAR; y += HUD_STEP) {
    const len = y % HUD_LONG_EVERY === 0 ? HUD_LONG : HUD_SHORT
    parts.push(`M${HUD_INSET} ${y}h${len}`, `M${width - HUD_INSET - len} ${y}h${len}`)
  }
  return parts.join("")
}
