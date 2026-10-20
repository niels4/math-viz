import type { CSSProperties } from "react"

import prototypeShot from "./prototype.jpg"

export type Phase = {
  route: string
  name: string
  colour: string
  story: string
  card: { title: string; text: string; image: string }
  // A link out of the app, shown as a button on the contents page and the phase page
  cta?: { label: string; href: string }
}

export const phaseColour = (phase: Phase) => ({ "--phase": phase.colour }) as CSSProperties

export const progression = (path: string) => `dev/progression/${path}`

export const concept: Phase = {
  route: "dev/concept",
  name: "Concept",
  colour: "var(--ordinal-03)",
  story:
    "I set out to build a demo with many synchronized interactive elements, to demonstrate that I can build UIs that feel fluid and responsive, with no jank. I worked with a UX agent that drove an image model to generate galleries of concept art, and picked six images, three light and three dark, as the visual direction.",
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
    "A math app is mostly numbers and formulas, so legibility drove the choice. I used an AI agent to build test pages that set each candidate in the app's own strings, and picked three.",
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
    "I used an AI agent to generate complete color themes and check their contrast, compared them on the same calculus screen, and kept six: three light and three dark.",
  card: {
    title: "Choosing the colors",
    text: "The six themes in the app, the one I dropped, and the pages I used to compare them.",
    image: progression("03-colors/thumbs/math-viz-themes.jpg"),
  },
}

export const prototype: Phase = {
  route: "dev/prototype",
  name: "Prototype",
  colour: "var(--ordinal-04)",
  story:
    "With the fonts and colors chosen, I generated the project with AI tooling: a Vite app with the latest dependencies, my fonts converted to the right format and loaded, and CSS variables generated for each color theme. I used it to prototype behavior that is difficult to describe in a markdown file but fast and easy to build in React.",
  card: {
    title: "The first prototype",
    text: "The first Function Viewer prototype: pick a function, scrub its transforms, and pan and zoom the plane.",
    image: prototypeShot,
  },
}

// The "260 Function Viewer v2" page of the MathViz-claude Figma file
export const figmaPage = "https://www.figma.com/design/yj7gdCaBuQw4X2806iUHRc/MathViz-claude?node-id=34-5316"

export const figma: Phase = {
  route: "dev/figma",
  name: "Figma",
  colour: "var(--ordinal-06)",
  story:
    "I gave the prototype and the concept art to a UX agent that designs in Figma. Figma works much better than a markdown file or unit tests for visual specs and for checking a design, and it let us try many design ideas quickly before committing any of them to code. The agent built 13 rounds of the Function Viewer, then merged the best ideas into one recommended design.",
  card: {
    title: "Designing in Figma",
    text: "The Function Viewer redesigned in Figma: 13 rounds of ideas, then one design with the specs to build it.",
    image: progression("05-figma/recommended/r2-pointer.png"),
  },
  cta: { label: "Open the design in Figma", href: figmaPage },
}

export const development: Phase = {
  route: "dev/development",
  name: "Development",
  colour: "var(--ordinal-02)",
  story:
    "I architected the project's organization and file layout, and made sure data and state flow through the app in a way that is simple to reason about. Then I offloaded the tedious work of matching styles from Figma to an AI coding agent. As we built, I looked for janky behavior that LLMs tend to miss when they evaluate a UI.",
  card: {
    title: "Building the app",
    text: "How I split the work with an AI coding agent, and the jank I caught along the way.",
    image: progression("06-development/function-viewer.jpg"),
  },
}

export const phases = [concept, fonts, colors, prototype, figma, development]
