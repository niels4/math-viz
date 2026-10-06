import type { NumberFieldEdit } from "#src/components/ui/NumberField.tsx"
import type { ScrubMode } from "#src/components/ui/scrub.ts"

import { FINE_DP, quantize, roundTo } from "#src/util/format/number.ts"

import type { MathPoint } from "../../CartesianPlane/scene.ts"
import type { PlaneView } from "../../CartesianPlane/viewport.ts"
import type { FvHandle, FvPart, FvPlaneMark, FvState } from "./state.ts"

import { BASE_FUNCTIONS, type BaseFunctionSlug } from "../math/baseFunctions.ts"
import {
  acceptsValue,
  DEFAULT_PARAMS,
  dragAnchor,
  dragStretch,
  TRANSFORM_PARAMS,
  type TransformParam,
} from "../math/form.ts"
import { curveAt } from "./selectors.ts"

/** Points sit on 0.01, so a marker, its label, its tags and its readout print one value. */
export const POINT_QUANTUM = 0.01

export type FvAction =
  | { type: "setFunction"; fn: BaseFunctionSlug }
  | { type: "setParam"; param: TransformParam; value: number }
  | { type: "resetParam"; param: TransformParam }
  | { type: "resetAll" }
  | { type: "flip"; param: "a" | "b" }
  | { type: "setP"; x: number }
  /**
   * The pointer on the plane at x, or off it (null). Q follows it over the
   * empty plane; over P's marker, while P is dragged and while the plane
   * pans, Q hides (FV 07 › pointer modes).
   */
  | { type: "planePointer"; x: number | null; over?: FvPlaneMark; panning?: boolean }
  | { type: "setGhost"; on: boolean }
  | { type: "setView"; view: PlaneView }
  /** The pointer enters or leaves a part. */
  | { type: "hover"; part: FvPart; on: boolean }
  /** The keyboard focus enters or leaves a part. */
  | { type: "focus"; part: FvPart; on: boolean }
  /** A drag on a part starts or changes mode, or ends (null). */
  | { type: "drag"; part: FvPart; mode: ScrubMode | null }
  /** A part's value field opens or changes its refusal, or closes (null). */
  | { type: "edit"; part: FvPart; edit: NumberFieldEdit | null }
  /** The pointer on the equation card, over a term (its parameter) or between them. */
  | { type: "eqPointer"; over: TransformParam | null }
  /** A handle dragged to `to` (D21): the anchor sets h and k, the stretch grip a and b. */
  | { type: "dragHandle"; handle: FvHandle; to: MathPoint }
  /** The moment after a drag is over: P's ghost and "moved" go (FV 04: 600 ms after release). */
  | { type: "clearPBefore" }

const withParam = (state: FvState, param: TransformParam, value: number): FvState =>
  state.params[param] === value ? state : { ...state, params: { ...state.params, [param]: value } }

/** The state with `fields` set, or the same state when they already hold those values. */
const patch = (state: FvState, fields: Partial<FvState>): FvState =>
  (Object.keys(fields) as (keyof FvState)[]).every((key) => Object.is(state[key], fields[key]))
    ? state
    : { ...state, ...fields }

const onPointLattice = (x: number): number => quantize(x, POINT_QUANTUM)

const isParam = (part: FvPart): part is TransformParam =>
  (TRANSFORM_PARAMS as readonly FvPart[]).includes(part)

/** A drag that changes the curve under P: a ruler's or a term's (a parameter), or a handle's. */
const isTransformDrag = (part: FvPart): boolean => isParam(part) || part === "anchor" || part === "stretch"

/**
 * FV 04: while a transform is dragged, P's ghost marks where it was and its
 * card says how far it moved. Any other change of the curve or of P
 * (typing, keys, a reset, a flip, another function, P itself) clears them.
 */
const trackP = (prev: FvState, next: FvState): FvState => {
  if (next === prev || next.pBefore === null) {
    return next
  }
  const curveChanged = next.params !== prev.params || next.fn !== prev.fn
  if (next.drag === null || !isTransformDrag(next.drag.part) || next.pX !== prev.pX) {
    return curveChanged || next.pX !== prev.pX ? { ...next, pBefore: null } : next
  }
  if (curveChanged && !next.pBefore.moved && Math.abs(curveAt(next, next.pX) - next.pBefore.y) > 1e-9) {
    return { ...next, pBefore: { ...next.pBefore, moved: true } }
  }
  return next
}

const sameView = (a: PlaneView | null, b: PlaneView): boolean =>
  a !== null &&
  a.zoom === b.zoom &&
  a.extent.minX === b.extent.minX &&
  a.extent.maxX === b.extent.maxX &&
  a.extent.minY === b.extent.minY &&
  a.extent.maxY === b.extent.maxY

// Every transition of the view. Unchanged values return the same state, so
// pointer moves inside one 0.01 step don't re-render. Decision D15: no
// transform action touches P's x; P's y follows the curve. Hover and focus
// each hold one part; a part leaving clears only its own claim, so a leave
// that arrives after the next part's enter changes nothing.
export function fvReducer(state: FvState, action: FvAction): FvState {
  return trackP(state, transition(state, action))
}

function transition(state: FvState, action: FvAction): FvState {
  switch (action.type) {
    case "setFunction":
      return action.fn === state.fn ? state : { ...state, fn: action.fn }
    case "setParam": {
      // No hidden digits (Specs › Numbers): a stored value prints whole at
      // 3 dp. `|| 0` keeps −0 out of the state; a scale never stores 0.
      if (!Number.isFinite(action.value)) {
        return state
      }
      const value = roundTo(action.value, FINE_DP) || 0
      return acceptsValue(action.param, value) ? withParam(state, action.param, value) : state
    }
    case "resetParam":
      return withParam(state, action.param, DEFAULT_PARAMS[action.param])
    case "resetAll":
      return { ...state, params: DEFAULT_PARAMS }
    case "flip":
      return withParam(state, action.param, -state.params[action.param] || 0)
    case "setP": {
      if (!Number.isFinite(action.x)) {
        return state
      }
      const pX = onPointLattice(action.x)
      return pX === state.pX ? state : { ...state, pX }
    }
    case "planePointer": {
      if (action.x === null || !Number.isFinite(action.x)) {
        return patch(state, {
          qX: null,
          planeOver: null,
          hover: state.hover === "plane" ? null : state.hover,
        })
      }
      const over = action.over ?? null
      const probing = over === null && action.panning !== true
      return patch(state, {
        qX: probing ? onPointLattice(action.x) : null,
        planeOver: over,
        hover: "plane",
        lead: "hover",
      })
    }
    case "setGhost":
      return action.on === state.ghostOn ? state : { ...state, ghostOn: action.on }
    case "setView":
      return sameView(state.view, action.view) ? state : { ...state, view: action.view }
    case "hover":
      return action.on
        ? patch(state, { hover: action.part, lead: "hover" })
        : state.hover === action.part
          ? patch(state, { hover: null, ...(action.part === "eq" && { eqOver: null }) })
          : state
    case "eqPointer":
      return patch(state, { hover: "eq", eqOver: action.over, lead: "hover" })
    case "dragHandle": {
      if (!Number.isFinite(action.to.x) || !Number.isFinite(action.to.y)) {
        return state
      }
      const params =
        action.handle === "anchor"
          ? dragAnchor(state.params, action.to)
          : dragStretch(BASE_FUNCTIONS[state.fn], state.params, action.to)
      return TRANSFORM_PARAMS.every((p) => params[p] === state.params[p]) ? state : { ...state, params }
    }
    case "clearPBefore":
      return state.drag === null ? patch(state, { pBefore: null }) : state
    case "focus":
      return action.on
        ? patch(state, { focus: action.part, lead: "focus" })
        : state.focus === action.part
          ? patch(state, { focus: null })
          : state
    case "drag": {
      if (action.mode === null) {
        return state.drag?.part === action.part ? patch(state, { drag: null }) : state
      }
      if (state.drag?.part === action.part) {
        return state.drag.mode === action.mode
          ? state
          : patch(state, { drag: { part: action.part, mode: action.mode } })
      }
      // A new drag: a transform's takes P where it is now (FV 04).
      return patch(state, {
        drag: { part: action.part, mode: action.mode },
        pBefore: isTransformDrag(action.part)
          ? { x: state.pX, y: curveAt(state, state.pX), moved: false }
          : null,
      })
    }
    case "edit": {
      if (action.edit === null) {
        return state.edit?.part === action.part ? patch(state, { edit: null }) : state
      }
      const { error, base } = action.edit
      return state.edit?.part === action.part && state.edit.error === error && state.edit.base === base
        ? state
        : patch(state, { edit: { part: action.part, error, base } })
    }
  }
}
