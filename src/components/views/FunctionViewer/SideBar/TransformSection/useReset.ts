import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import type { TransformParam } from "../../state.ts"

import { transformParams } from "../../queryParams.ts"

export const useReset = (param: TransformParam) => {
  const { defaultValue } = transformParams[param]
  const [value, setValue] = useQueryParam(transformParams[param])
  return {
    changed: value !== defaultValue,
    defaultValue,
    jump: { param, from: value, to: defaultValue },
    reset: () => setValue(defaultValue, { flush: true }),
  }
}
