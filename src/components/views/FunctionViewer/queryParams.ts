import { queryParamAtom, type QueryParamDef } from "#src/components/router/queryParamAtom.ts"

import type { TransformParam } from "./state"

export const FUNCTION_SLUGS = ["x1", "x2", "x3", "sinx"] as const
export type FunctionSlug = (typeof FUNCTION_SLUGS)[number]

const isFunctionSlug = (raw: string): raw is FunctionSlug =>
  (FUNCTION_SLUGS as readonly string[]).includes(raw)

export const funcParam = queryParamAtom<FunctionSlug>("func", {
  parse: (raw) => (raw != null && isFunctionSlug(raw) ? raw : undefined),
  serialize: (v) => v,
  defaultValue: "x2",
})

const numberParam = (key: string, defaultValue: number, isScale: boolean) =>
  queryParamAtom<number>(key, {
    parse: (raw) => {
      if (raw == null) {
        return undefined
      }
      const n = Number(raw)
      return Number.isFinite(n) && !(isScale && n === 0) ? n : undefined
    },
    serialize: (v) => String(Number(v.toFixed(3))),
    defaultValue,
  })

export const aParam = numberParam("a", 1, true)
export const bParam = numberParam("b", 1, true)
export const hParam = numberParam("h", 0, false)
export const kParam = numberParam("k", 0, false)

export const pParam = numberParam("p", 2, false)

export const transformParams: Record<TransformParam, QueryParamDef<number>> = {
  a: aParam,
  b: bParam,
  h: hParam,
  k: kParam,
}
