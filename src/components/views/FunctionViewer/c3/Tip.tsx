import { Phrases, type Phrase } from "#src/components/ui/Phrases.tsx"

import style from "./Tip.module.css"

// A tip where the hint bar spoke (figma0 SB · B › Tooltip): a card of
// words; its owner places it. Seen, not heard: the sidebar's status line
// says the same to screen readers.
export function Tip({
  phrases,
  tone,
  className,
  testId,
}: {
  phrases: readonly Phrase[]
  tone?: "error" | undefined
  className?: string
  testId?: string
}) {
  return (
    <div
      className={className === undefined ? style.tip : `${style.tip} ${className}`}
      data-tone={tone}
      data-testid={testId}
      aria-hidden="true"
    >
      <Phrases phrases={phrases} words />
    </div>
  )
}
