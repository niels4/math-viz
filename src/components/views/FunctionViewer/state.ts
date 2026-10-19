import { atom, type Atom, type PrimitiveAtom } from "jotai"

export type TransformParam = "a" | "b" | "h" | "k"

// These last only while the page is open: not in the URL or storage.

// Whether the pointer is on each transform parameter: its row, or its part
// of the equation.
export const hoverAtoms: Record<TransformParam, PrimitiveAtom<boolean>> = {
  a: atom(false),
  b: atom(false),
  h: atom(false),
  k: atom(false),
}

// The parameter whose row has the keyboard's focus, if any.
export const focusAtom = atom<TransformParam | null>(null)

const highlightOf = (param: TransformParam): Atom<boolean> =>
  atom((get) => get(hoverAtoms[param]) || get(focusAtom) === param)

// Whether each transform parameter is highlighted, everywhere it shows in
// the view: while the pointer is on it or its row has the focus. Several can
// be at once, such as h and k while a shift handle is held.
export const highlightAtoms: Record<TransformParam, Atom<boolean>> = {
  a: highlightOf("a"),
  b: highlightOf("b"),
  h: highlightOf("h"),
  k: highlightOf("k"),
}
