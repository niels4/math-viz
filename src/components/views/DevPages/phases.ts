import type { CSSProperties } from "react"

export type Phase = {
  route: string
  name: string
  colour: string
  story: string
  card: { title: string; text: string; image: string }
}

export const phaseColour = (phase: Phase) => ({ "--phase": phase.colour }) as CSSProperties

export const progression = (path: string) => `dev/progression/${path}`

export const concept: Phase = {
  route: "dev/concept",
  name: "Concept",
  colour: "var(--ordinal-03)",
  story:
    "Before any design work, image generation sketched what MathViz could look like, in a light and a dark scheme.",
  card: {
    title: "Concept stills",
    text: "Six screens, three light and three dark: an overview, a tangent close-up, and shapes and points.",
    image: progression("01-concept/04-dark-overview.jpg"),
  },
}

export const fonts: Phase = {
  route: "dev/fonts",
  name: "Fonts",
  colour: "var(--ordinal-05)",
  story:
    "A font lab set each candidate in live specimens on the app's own strings. Three fonts came out of it.",
  card: {
    title: "The picks and the font lab",
    text: "Work Sans for UI, Roboto Mono for numbers and STIX Two Text for maths, and the galleries that picked them.",
    image: progression("02-fonts/thumbs/mathviz-numerals.jpg"),
  },
}

export const colors: Phase = {
  route: "dev/colors",
  name: "Colors",
  colour: "var(--ordinal-01)",
  story:
    "A colour lab built each palette as a full set of UI tokens and checked its contrast. Six themes shipped.",
  card: {
    title: "Six themes and the colour lab",
    text: "Three light and three dark themes on one calculus screen, one retired theme, and 12 series colours each.",
    image: progression("03-colors/thumbs/math-viz-themes.jpg"),
  },
}

export const phases = [concept, fonts, colors]
