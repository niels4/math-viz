import { useAtomValue } from "jotai"

import { helpShownAtom } from "../state"
import style from "./HelpOverlay.module.css"

export const HelpOverlay = () => {
  const shown = useAtomValue(helpShownAtom)

  if (!shown) {
    return null
  }
  return (
    <div className={style.overlay}>
      <div className={style.hello}>Hello</div>
    </div>
  )
}
