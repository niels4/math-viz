import { atom } from "jotai"

import { unscaledUnitSize } from "./constants"
import { centerParam, scaleParam } from "./queryParams"

export type VisibleRange = { minX: number; maxX: number; minY: number; maxY: number }

export const planeSizeAtom = atom({ width: 0, height: 0 })

export const visibleRangeAtom = atom((get): VisibleRange | null => {
  const { width, height } = get(planeSizeAtom)
  if (width === 0 || height === 0) {
    return null
  }
  const [x, y] = get(centerParam.atom)
  const pxPerUnit = unscaledUnitSize / get(scaleParam.atom)
  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)
  return {
    minX: x - centerX / pxPerUnit,
    maxX: x + (width - centerX) / pxPerUnit,
    minY: y - (height - centerY) / pxPerUnit,
    maxY: y + centerY / pxPerUnit,
  }
})
