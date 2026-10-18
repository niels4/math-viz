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
