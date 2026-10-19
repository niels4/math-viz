import { atom, type Atom } from "jotai"

export type TransformParam = "a" | "b" | "h" | "k"

export const flipAtom = atom<{ param: TransformParam; from: number; to: number } | null>(null)

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

const litAtom = atom((get) => {
  const { hover, focus, lead } = get(touchAtom)
  return lead === "hover" ? (hover ?? focus) : (focus ?? hover)
})

const highlightOf = (param: TransformParam): Atom<boolean> => atom((get) => get(litAtom) === param)

export const highlightAtoms: Record<TransformParam, Atom<boolean>> = {
  a: highlightOf("a"),
  b: highlightOf("b"),
  h: highlightOf("h"),
  k: highlightOf("k"),
}
