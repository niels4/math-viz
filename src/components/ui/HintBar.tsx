import style from "./HintBar.module.css"
import { Phrases, type Phrase } from "./Phrases.tsx"

export type Hint = { phrases: readonly Phrase[]; tone?: "error" }

// The hint line (figma0 hint-bar-fv): one hint about what the pointer or the
// focus is on, in a box whose height never follows what it says: 48 px, or
// three rows' worth where it is too narrow for every hint to fit two.
// Phrases sit 6 px apart and wrap whole into rows 4 apart, centred; a phrase
// too long for a row wraps inside. Screen readers hear each new hint,
// politely.
export function HintBar({ hint, className, testId }: { hint: Hint; className?: string; testId?: string }) {
  return (
    <div className={className === undefined ? style.frame : `${style.frame} ${className}`}>
      <div role="status" className={style.bar} data-tone={hint.tone} data-testid={testId}>
        <Phrases phrases={hint.phrases} />
      </div>
    </div>
  )
}
