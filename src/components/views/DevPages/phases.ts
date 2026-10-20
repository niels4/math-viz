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
    "I started by asking an AI image tool to imagine what MathViz could look like. Its pictures gave me a direction before I designed anything.",
  card: {
    title: "The first pictures",
    text: "Six pictures of a math app, three light and three dark.",
    image: progression("01-concept/04-dark-overview.jpg"),
  },
}

export const fonts: Phase = {
  route: "dev/fonts",
  name: "Fonts",
  colour: "var(--ordinal-05)",
  story:
    "A math app shows a lot of numbers and formulas, so I needed fonts that keep them easy to read. AI built test pages to compare them, and I picked three.",
  card: {
    title: "Choosing the fonts",
    text: "The three fonts I picked, and the pages I used to compare them.",
    image: progression("02-fonts/thumbs/mathviz-numerals.jpg"),
  },
}

export const colors: Phase = {
  route: "dev/colors",
  name: "Colors",
  colour: "var(--ordinal-01)",
  story:
    "AI built complete color themes so I could compare them on the same screen. I kept six, three light and three dark.",
  card: {
    title: "Choosing the colors",
    text: "The six themes in the app, the one I dropped, and the pages I used to compare them.",
    image: progression("03-colors/thumbs/math-viz-themes.jpg"),
  },
}

export const phases = [concept, fonts, colors]
