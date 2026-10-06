import { useId, useState } from "react"

import tipStyles from "./HelpTip.module.css"
import { HelpIcon } from "./icons.tsx"

export type HelpRow = {
  keys: string
  text: string
}

export type HelpContent = {
  title: string
  rows: HelpRow[]
}

// A small "?" button with an accessible tooltip. Hover or keyboard focus
// opens it transiently; click/tap pins it open (touch has no hover), and it
// closes on Escape, blur, or a second click. Blur always unpins, so tabbing
// away can never leave a tooltip stranded open.
export function HelpTip({ help, label = "Help" }: { help: HelpContent; label?: string }) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const open = pinned || hovered
  const tipId = useId()
  return (
    <span
      className={tipStyles.wrap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className={tipStyles.button}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setPinned((v) => !v)}
        onFocus={() => setHovered(true)}
        onBlur={() => {
          setHovered(false)
          setPinned(false)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setHovered(false)
            setPinned(false)
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <HelpIcon />
      </button>
      {open && (
        <span role="tooltip" id={tipId} className={tipStyles.bubble}>
          <span className={tipStyles.title}>{help.title}</span>
          <span className={tipStyles.rows}>
            {help.rows.map((row) => (
              <span key={row.keys} className={tipStyles.row}>
                <kbd className={tipStyles.keys}>{row.keys}</kbd>
                <span className={tipStyles.text}>{row.text}</span>
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  )
}
