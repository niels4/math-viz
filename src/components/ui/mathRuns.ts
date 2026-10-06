// How maths inside text is set (MathText): single-letter variables italic,
// function names upright, the rest as typed. Callers pass plain strings:
// "f(x) =", "sin x", "+ k".

export type MathRun = {
  text: string
  italic: boolean
  /** An italic letter right before "(": it gets the italic correction so f( doesn't collide. */
  beforeParen: boolean
}

const PART = /(sin|cos|tan)|([A-Za-z])|([^A-Za-z]+)/g

export const mathRuns = (text: string): MathRun[] => {
  const runs: MathRun[] = []
  for (const [part, name] of text.matchAll(PART)) {
    const italic = name === undefined && /^[A-Za-z]$/.test(part)
    const last = runs.at(-1)
    if (last !== undefined && !last.italic && !italic) {
      last.text += part
    } else {
      runs.push({ text: part, italic, beforeParen: false })
    }
  }
  runs.forEach((run, i) => {
    run.beforeParen = run.italic && runs[i + 1]?.text.startsWith("(") === true
  })
  return runs
}
