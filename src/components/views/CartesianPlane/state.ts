import { atom } from "jotai"

import { unscaledUnitSize } from "./constants"
import { centerParam, scaleParam } from "./queryParams"

export const planeWidthAtom = atom(0)

export const visibleXAtom = atom((get) => {
  const width = get(planeWidthAtom)
  const [x] = get(centerParam.atom)
  const pxPerUnit = unscaledUnitSize / get(scaleParam.atom)
  const centerX = Math.floor(width / 2)
  return { minX: x - centerX / pxPerUnit, maxX: x + (width - centerX) / pxPerUnit }
})
