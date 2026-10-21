import { useState } from "react"

import { CloseIcon } from "#src/components/icons/icons.tsx"

import style from "./LandscapeHint.module.css"

export const LandscapeHint = () => {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) {
    return null
  }

  return (
    <div className={style.landscape_hint}>
      <p>Turn your phone to landscape for a better view.</p>
      <button type="button" className={style.dismiss} aria-label="Dismiss" onClick={() => setDismissed(true)}>
        <CloseIcon />
      </button>
    </div>
  )
}
