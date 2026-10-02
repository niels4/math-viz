import cn from "classnames"

import { useResizeObserver } from "#src/components/hooks/useResizeObserver.ts"
import { useAppTheme } from "#src/state/useAppTheme.ts"

import style from "./cartesian-plane.module.css"

export default function CartesianPlanePage() {
  const { themeClass } = useAppTheme()
  const { ref, width, height } = useResizeObserver()

  return (
    <div ref={ref} className={cn(themeClass, style.page)}>
      {width} X {height}
    </div>
  )
}
