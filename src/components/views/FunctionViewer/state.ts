import { atom, type PrimitiveAtom } from "jotai"

export type TransformParam = "a" | "b" | "h" | "k"

// Whether each transform parameter is highlighted, everywhere it shows in
// the view. Several can be at once, such as h and k while a shift handle is
// held. These last only while the page is open: not in the URL or storage.
export const highlightAtoms: Record<TransformParam, PrimitiveAtom<boolean>> = {
  a: atom(false),
  b: atom(false),
  h: atom(false),
  k: atom(false),
}
