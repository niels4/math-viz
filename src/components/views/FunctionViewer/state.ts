import { atom, type Atom, type PrimitiveAtom } from "jotai"

import type { ScrubMode } from "./SideBar/TransformSection/ScrubValue/scrub"

export type TransformParam = "a" | "b" | "h" | "k"

export const jumpsAtom = atom<{ param: TransformParam; from: number; to: number }[]>([])

type Touch = "hover" | "focus"

const touchAtom = atom<Record<Touch, TransformParam | null> & { lead: Touch }>({
  hover: null,
  focus: null,
  lead: "hover",
})

const touch = (by: Touch) =>
  atom(null, (get, set, param: TransformParam, on: boolean) => {
    const touched = get(touchAtom)
    if (on) {
      set(touchAtom, { ...touched, [by]: param, lead: by })
    } else if (touched[by] === param) {
      set(touchAtom, { ...touched, [by]: null })
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

export const litAtom = atom((get): TransformParam[] => {
  const scrubbed = params.filter((param) => get(scrubModeAtoms[param]) !== null)
  if (scrubbed.length > 0) {
    return scrubbed
  }
  const { hover, focus, lead } = get(touchAtom)
  const touched = lead === "hover" ? (hover ?? focus) : (focus ?? hover)
  return touched === null ? [] : [touched]
})

const highlightOf = (param: TransformParam): Atom<boolean> => atom((get) => get(litAtom).includes(param))

export const highlightAtoms: Record<TransformParam, Atom<boolean>> = {
  a: highlightOf("a"),
  b: highlightOf("b"),
  h: highlightOf("h"),
  k: highlightOf("k"),
}
