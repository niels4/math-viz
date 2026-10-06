import { mathRuns } from "./mathRuns.ts"

// Maths inside text, in the surrounding font (STIX Two Text wherever maths
// shows): letters as <var>, italic, through mathRuns. Nothing is added
// between an italic letter and an upright "(": the boards set "f(" at the
// fonts' own advances.
export function MathText({ text }: { text: string }) {
  return mathRuns(text).map((run, i) => (run.italic ? <var key={i}>{run.text}</var> : run.text))
}
