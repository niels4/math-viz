import { createContext, useContext } from "react"

export const FieldIdContext = createContext<string | null>(null)

// The id the enclosing Field minted for its control, if any. Inputs nested
// under a Field default to it so label and control stay linked with no
// caller wiring; standalone inputs fall back to their own useId.
export const useFieldId = (): string | null => useContext(FieldIdContext)
