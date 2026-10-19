import { atom, type Atom } from "jotai"

export type TransformParam = "a" | "b" | "h" | "k"

// These last only while the page is open: not in the URL or storage.

type Touch = "hover" | "focus"

// The parameter the pointer is on, in its row or its part of the equation;
// the parameter whose row has the keyboard's focus; and which of the two
// moved last.
const touchAtom = atom<Record<Touch, TransformParam | null> & { lead: Touch }>({
  hover: null,
  focus: null,
  lead: "hover",
})

// Sets the pointer or the focus on (on: true) or off a parameter. Leaving
// one the pointer or the focus has already moved past changes nothing.
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

// The parameter the pointer or the focus moved to last, or else the one the
// other is on, so focusing a's box and pointing at k lights only k.
const litAtom = atom((get) => {
  const { hover, focus, lead } = get(touchAtom)
  return lead === "hover" ? (hover ?? focus) : (focus ?? hover)
})

const highlightOf = (param: TransformParam): Atom<boolean> => atom((get) => get(litAtom) === param)

// Whether each transform parameter is highlighted, everywhere it shows in
// the view.
export const highlightAtoms: Record<TransformParam, Atom<boolean>> = {
  a: highlightOf("a"),
  b: highlightOf("b"),
  h: highlightOf("h"),
  k: highlightOf("k"),
}
