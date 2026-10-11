import type { ComponentType, HTMLAttributes } from "react"

import type { Phrase } from "#src/components/ui/Phrases.tsx"

import type { TransformParam } from "./math/form.ts"
import type { FvAction } from "./model/reducer.ts"
import type { FvPart, FvState, PartEvents } from "./model/state.ts"

import { C3_GESTURE_LEAD, C3_TOUR_DRAG } from "./c3/c3Copy.ts"
import c3Style from "./c3/C3Sidebar.module.css"
import { C3Sidebar } from "./c3/C3Sidebar.tsx"
import { RULER_GESTURE_LEAD, TOUR } from "./copy.ts"
import rulerStyle from "./panel/RulerSidebar.module.css"
import { RulerSidebar } from "./panel/RulerSidebar.tsx"

/** What the view hands its sidebar: the state, its actions, and the wiring the plane and the help share. */
export type SidebarProps = {
  state: FvState
  dispatch: (action: FvAction) => void
  /** Each part's hover, focus, drag and edit, as its own actions. */
  eventsOf: (part: FvPart) => PartEvents
  /** A term's drag and double-click (D13), shared by the equation's two lines. */
  bindTerm: (param: TransformParam) => HTMLAttributes<HTMLSpanElement>
  /** The open explainer, by parameter, and its id. */
  explaining: { param: TransformParam; id: string } | null
}

/**
 * A sidebar for the Function Viewer: the panel's contents, and a class for
 * the panel itself. The view keeps the state, the plane, the motion and the
 * help, so the sidebars share them: today's rulers on `#demos/function-viewer`,
 * figma0's C3 number rows on `#demos/function-viewer-v2` (`c3/`).
 */
export type FvSidebar = {
  Panel: ComponentType<SidebarProps>
  panelClass?: string
  /** How the view's help names the sidebar's controls. */
  help: SidebarHelp
  /** A class for a parameter's explainer, e.g. to ink its chip as the sidebar's. */
  explainerClass?: (param: TransformParam) => string
}

/**
 * The help's words for what the sidebar has you drag: the tour's step 2
 * (FV 08) and the explainer's gestures (D12). The tour's hand grabs the
 * part the sidebar marks `data-part="grip-k"`, else k's control's foot.
 */
export type SidebarHelp = {
  tourDrag: readonly Phrase[]
  explainerLead: readonly Phrase[]
}

/** Today's sidebar (figma0 FV · Recommended): rulers in two columns, P's card and Q's, the hint bar. */
export const RULER_SIDEBAR: FvSidebar = {
  Panel: RulerSidebar,
  panelClass: rulerStyle.panel,
  help: { tourDrag: TOUR.steps[2].body, explainerLead: RULER_GESTURE_LEAD },
}

/**
 * figma0's SB3 · C3 · Ordinal correlations: number rows on sub cards, a
 * colour per parameter wherever it appears.
 */
export const C3_SIDEBAR: FvSidebar = {
  Panel: C3Sidebar,
  help: { tourDrag: C3_TOUR_DRAG, explainerLead: C3_GESTURE_LEAD },
  explainerClass: (param) => c3Style[`explainer_${param}`],
}
