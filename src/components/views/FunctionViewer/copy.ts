// The Function Viewer's user-facing strings, so wording changes in one place.
// Maths in a string is set by MathText (italic letters, upright names).

export const VIEW_TITLE = "Function Viewer"
export const VIEW_SUBTITLE = "Functions · transformations"

/** The panel's numbered sections, in reading order. */
export const SECTIONS = {
  function: { step: 1, title: "Function" },
  transform: { step: 2, title: "Transform" },
  points: { step: 3, title: "Points" },
} as const

export const PICKER_LABEL = "Base function"

/** The caps label before the equation's general form. */
export const FORM_LABEL = "Form"
