import { queryParamAtom } from "#src/components/router/queryParamAtom.ts"

export const FUNCTION_SLUGS = ["x1", "x2", "x3", "sinx"] as const
export type FunctionSlug = (typeof FUNCTION_SLUGS)[number]

const isFunctionSlug = (raw: string): raw is FunctionSlug =>
  (FUNCTION_SLUGS as readonly string[]).includes(raw)

// The function the plane graphs. x1 is the default, so it stays out of the URL.
export const funcParam = queryParamAtom<FunctionSlug>("func", {
  parse: (raw) => (raw != null && isFunctionSlug(raw) ? raw : undefined),
  serialize: (v) => v,
  defaultValue: "x1",
})

// The transform y = a · f((x − h) / b) + k. Defaults are the identity, so an
// untransformed curve keeps them out of the URL. A scale (a or b) of 0 would
// squash the curve flat, so the URL can't set one.
const transformParam = (key: string, defaultValue: number, isScale: boolean) =>
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

export const aParam = transformParam("a", 1, true)
export const bParam = transformParam("b", 1, true)
export const hParam = transformParam("h", 0, false)
export const kParam = transformParam("k", 0, false)
