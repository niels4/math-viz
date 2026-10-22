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
    <>
      <div className={cn(style.tip, style.beside, style.function_tip)}>
        Pick a function with these buttons. The readout below shows its equation with your transform values,
        and the general form under it.
      </div>
      <div className={cn(style.tip, style.beside, style.transform_tip)}>
        These rows stretch and move the curve: y scale and y shift up and down, x scale and x shift side to
        side. Drag a value sideways or click it to type one. The arrow buttons flip the curve.
      </div>
      <div className={cn(style.tip, style.beside, style.points_tip)}>
        P sits on the curve: drag it with the slider or on the plane, or type its x. Q follows your pointer
        over the plane. Each row reads f(x) at its point.
      </div>
      <div className={cn(style.tip, style.grid_tip)}>
        Drag the grid to pan, and scroll or pinch to zoom. Drag the diamond to move the curve and the square
        to stretch it. Drag P along the curve, and Q follows your pointer.
      </div>
    </>
  )
}
