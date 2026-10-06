import type { Phrase } from "./Phrases.tsx"

/** The words of rich copy as read aloud, one string per item (Phrases.tsx). */
export const phraseWords = (phrases: readonly Phrase[]): string[] =>
  phrases.flatMap((p) =>
    "together" in p ? phraseWords(p.together) : ["text" in p ? p.text : "math" in p ? p.math : p.key],
  )
