import { mathRuns } from "./mathRuns.ts"
import style from "./MathText.module.css"

// Maths inside text, in the surrounding font (STIX Two Text wherever maths
// shows): letters as <var>, italic, through mathRuns.
export function MathText({ text }: { text: string }) {
  return mathRuns(text).map((run, i) =>
    run.italic ? (
      <var key={i} className={run.beforeParen ? style.before_paren : undefined}>
        {run.text}
      </var>
    ) : (
      run.text
    ),
  )
}
