import { useMediaQuery } from "#src/components/hooks/useMediaQuery.ts"

/**
 * Decision D16 (FV 06; R9): below 860 px of window height the panel turns
 * into a dock under a full-width plane. The dock's columns (1 Function 352,
 * 2 Transform 474, then P's and Q's cards) need a window this wide; a
 * narrower short window keeps the side panel, which scrolls.
 */
export const DOCK_QUERY = "(max-height: 859px) and (min-width: 1168px)"

/** The side panel beside the plane (FV 01), or the dock under it (FV 06). */
export type FvLayout = "side" | "dock"

export const useFvLayout = (): FvLayout => (useMediaQuery(DOCK_QUERY) ? "dock" : "side")
