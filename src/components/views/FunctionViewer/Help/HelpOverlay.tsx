import cn from "classnames"
import { useAtomValue } from "jotai"

import { helpShownAtom } from "../state"
import style from "./HelpOverlay.module.css"

export const HelpOverlay = () => {
  const shown = useAtomValue(helpShownAtom)

  if (!shown) {
    return null
  }
  return (
    <div className={cn(style.tip, style.function_tip)}>
      Pick a function with these buttons. The readout below shows its equation with your transform values, and
      the general form under it.
    </div>
  )
}
