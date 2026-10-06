import { Fragment } from "react"

import { Kbd } from "./Kbd.tsx"
import { MathText } from "./MathText.tsx"
import style from "./Phrases.module.css"

/** One phrase of rich UI copy: words, maths (set by MathText) or a key cap. */
export type Phrase = { text: string } | { math: string } | { key: string }

/** A " ·" separator keeps to the word before it, so a wrapping phrase never starts a row with one. */
const keepSeparators = (text: string): string => text.replaceAll(" ·", "\u00a0·")

// Rich UI copy as flex items (figma0 fvRich): words in the UI face at 14,
// maths in STIX 16, keys as caps, each phrase kept whole. The owner's flex
// box sets the gaps and the wrapping; the spaces between phrases are for
// screen readers, since flex layout drops them.
export function Phrases({ phrases }: { phrases: readonly Phrase[] }) {
  return phrases.map((phrase, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      {"key" in phrase ? (
        <Kbd name={phrase.key} />
      ) : "math" in phrase ? (
        <span className={style.math}>
          <MathText text={phrase.math} />
        </span>
      ) : (
        <span className={style.text}>{keepSeparators(phrase.text)}</span>
      )}
    </Fragment>
  ))
}
