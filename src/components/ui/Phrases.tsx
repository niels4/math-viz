import { Fragment } from "react"

import { Kbd } from "./Kbd.tsx"
import { MathText } from "./MathText.tsx"
import style from "./Phrases.module.css"

/** One phrase of rich UI copy: words, maths (set by MathText) or a key cap. */
export type Phrase = { text: string } | { math: string } | { key: string }

/** A " ·" separator keeps to the word before it, so a wrapping phrase never starts a row with one. */
const keepSeparators = (text: string): string => text.replaceAll(" ·", "\u00a0·")

/** With `words`, each word of a text phrase is an item of its own, so the copy wraps like prose. */
const items = (phrases: readonly Phrase[], words: boolean): Phrase[] =>
  words
    ? phrases.flatMap((phrase): Phrase[] =>
        "text" in phrase
          ? keepSeparators(phrase.text)
              .split(" ")
              .filter((word) => word !== "")
              .map((word) => ({ text: word }))
          : [phrase],
      )
    : phrases.map((phrase) => ("text" in phrase ? { text: keepSeparators(phrase.text) } : phrase))

// Rich UI copy as flex items (figma0 fvRich): words in the UI face, maths in
// STIX two px larger, keys as caps. Each phrase is kept whole, or with
// `words` each word, as fvRich lays out longer copy. The owner's flex box
// sets the gaps and the wrapping, and its custom properties the sizes
// (--phrase-text-size and -line, --phrase-math-size and -line: 14 / 16 and
// 16 / 20 unless set). The spaces between items are for screen readers,
// since flex layout drops them.
export function Phrases({ phrases, words = false }: { phrases: readonly Phrase[]; words?: boolean }) {
  return items(phrases, words).map((phrase, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      {"key" in phrase ? (
        <Kbd name={phrase.key} />
      ) : "math" in phrase ? (
        <span className={style.math}>
          <MathText text={phrase.math} />
        </span>
      ) : (
        <span className={style.text}>{phrase.text}</span>
      )}
    </Fragment>
  ))
}
