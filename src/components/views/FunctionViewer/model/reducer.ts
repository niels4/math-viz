import { FINE_DP, quantize, roundTo } from "#src/util/format/number.ts"

import type { PlaneView } from "../../CartesianPlane/viewport.ts"
import type { BaseFunctionSlug } from "../math/baseFunctions.ts"
import type { FvState } from "./state.ts"

import { DEFAULT_PARAMS, type TransformParam } from "../math/form.ts"

/** Points sit on 0.01, so a marker, its label, its tags and its readout print one value. */
export const POINT_QUANTUM = 0.01

export type FvAction =
  | { type: "setFunction"; fn: BaseFunctionSlug }
  | { type: "setParam"; param: TransformParam; value: number }
  | { type: "resetParam"; param: TransformParam }
  | { type: "resetAll" }
  | { type: "flip"; param: "a" | "b" }
  | { type: "setP"; x: number }
  | { type: "setQ"; x: number | null }
  | { type: "setGhost"; on: boolean }
  | { type: "setView"; view: PlaneView }

const withParam = (state: FvState, param: TransformParam, value: number): FvState =>
  state.params[param] === value ? state : { ...state, params: { ...state.params, [param]: value } }

const onPointLattice = (x: number): number => quantize(x, POINT_QUANTUM)

const sameView = (a: PlaneView | null, b: PlaneView): boolean =>
  a !== null &&
  a.zoom === b.zoom &&
  a.extent.minX === b.extent.minX &&
  a.extent.maxX === b.extent.maxX &&
  a.extent.minY === b.extent.minY &&
  a.extent.maxY === b.extent.maxY

// Every transition of the view. Unchanged values return the same state, so
// pointer moves inside one 0.01 step don't re-render. Decision D15: no
// transform action touches P's x; P's y follows the curve.
export function fvReducer(state: FvState, action: FvAction): FvState {
  switch (action.type) {
    case "setFunction":
      return action.fn === state.fn ? state : { ...state, fn: action.fn }
    case "setParam":
      // No hidden digits (Specs › Numbers): a stored value prints whole at
      // 3 dp. `|| 0` keeps −0 out of the state.
      return Number.isFinite(action.value)
        ? withParam(state, action.param, roundTo(action.value, FINE_DP) || 0)
        : state
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
    case "setQ": {
      const qX = action.x === null || !Number.isFinite(action.x) ? null : onPointLattice(action.x)
      return qX === state.qX ? state : { ...state, qX }
    }
    case "setGhost":
      return action.on === state.ghostOn ? state : { ...state, ghostOn: action.on }
    case "setView":
      return sameView(state.view, action.view) ? state : { ...state, view: action.view }
  }
}
