import type { GlyphDirection } from "./glyphPaths.ts"

import { ArrowIcon } from "./icons.tsx"
import style from "./Kbd.module.css"

const ARROWS: Readonly<Record<string, GlyphDirection>> = { "←": "left", "→": "right", "↑": "up", "↓": "down" }

const SPOKEN: Readonly<Record<GlyphDirection, string>> = {
  left: "Left arrow",
  right: "Right arrow",
  up: "Up arrow",
  down: "Down arrow",
}

// A key cap (figma0 kbd-fv): the key's name in Roboto Mono, or an arrow,
// drawn because the shipped fonts lack U+2190–2193. Screen readers hear the
// arrow's name.
export function Kbd({ name }: { name: string }) {
  const dir = ARROWS[name]
  return (
    <kbd className={style.key}>
      {dir === undefined ? (
        name
      ) : (
        <>
          <ArrowIcon dir={dir} />
          <span className={style.spoken}>{SPOKEN[dir]}</span>
        </>
      )}
    </kbd>
  )
}
