import type { FunctionSlug } from "../FunctionViewer/queryParams"
import type { Transform } from "../FunctionViewer/transformCurves"

export type LoopState = { func: FunctionSlug } & Transform

export const welcomeStill: LoopState = { func: "sinx", a: 3, k: 0, b: 1.48, h: 1 }
