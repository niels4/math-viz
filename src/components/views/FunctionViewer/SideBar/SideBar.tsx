import cn from "classnames"

import { useAppTheme } from "#src/state/useAppTheme.ts"
import { param_colours } from "#src/style/param_colours.module.css"

import { FunctionSelector } from "./FunctionSelector/FunctionSelector"
import { PointsSection } from "./PointsSection/PointsSection"
import style from "./SideBar.module.css"
import { TransformSection } from "./TransformSection/TransformSection"

export const SideBar = () => {
  const { themeSlug } = useAppTheme()

  return (
    <div className={cn(style.sidebar, param_colours)} data-theme={themeSlug}>
      <FunctionSelector />
      <TransformSection />
      <PointsSection />
    </div>
  )
}
