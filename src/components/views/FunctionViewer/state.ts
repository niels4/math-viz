import { atom, type Atom, type PrimitiveAtom } from "jotai"

import type { ScrubMode } from "./SideBar/TransformSection/ScrubValue/scrub"

export type TransformParam = "a" | "b" | "h" | "k"

export const pDraggingAtom = atom(false)

export const jumpsAtom = atom<{ param: TransformParam; from: number; to: number }[]>([])

type Touch = "hover" | "focus"

const touchAtom = atom<Record<Touch, readonly TransformParam[]> & { lead: Touch }>({
  hover: [],
  focus: [],
  lead: "hover",
})

const sameParams = (x: readonly TransformParam[], y: readonly TransformParam[]) =>
  x.length === y.length && x.every((param, i) => param === y[i])

const touch = (by: Touch) =>
  atom(null, (get, set, params: readonly TransformParam[], on: boolean) => {
    const touched = get(touchAtom)
    if (on) {
      set(touchAtom, { ...touched, [by]: params, lead: by })
    } else if (sameParams(touched[by], params)) {
      set(touchAtom, { ...touched, [by]: [] })
    }
  })

export const hoverAtom = touch("hover")
export const focusAtom = touch("focus")

export const scrubModeAtoms: Record<TransformParam, PrimitiveAtom<ScrubMode | null>> = {
  a: atom<ScrubMode | null>(null),
  b: atom<ScrubMode | null>(null),
  h: atom<ScrubMode | null>(null),
  k: atom<ScrubMode | null>(null),
}

const params = ["a", "b", "h", "k"] as const

export const transformDragAtom = atom((get) => params.some((param) => get(scrubModeAtoms[param]) !== null))

export const litAtom = atom((get): readonly TransformParam[] => {
  const scrubbed = params.filter((param) => get(scrubModeAtoms[param]) !== null)
  if (scrubbed.length > 0) {
    return scrubbed
  }
  const { hover, focus, lead } = get(touchAtom)
  const [first, second] = lead === "hover" ? [hover, focus] : [focus, hover]
  return first.length > 0 ? first : second
})

const highlightOf = (param: TransformParam): Atom<boolean> => atom((get) => get(litAtom).includes(param))

export const highlightAtoms: Record<TransformParam, Atom<boolean>> = {
  a: highlightOf("a"),
  b: highlightOf("b"),
  h: highlightOf("h"),
  k: highlightOf("k"),
}
