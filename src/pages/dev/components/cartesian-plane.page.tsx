import cn from "classnames"

import { useAppTheme } from "#src/state/useAppTheme.ts"

import style from "./cartesian-plane.module.css"

export default function CartesianPlanePage() {
  const { themeClass } = useAppTheme()
  return <div className={cn(themeClass, style.page)}></div>
}
