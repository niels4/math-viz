import { useAppTheme } from "#src/state/useAppTheme.ts"

import { FunctionSelector } from "./FunctionSelector"
import style from "./SideBar.module.css"
import { TransformSection } from "./TransformSection"

export const SideBar = () => {
  const { themeSlug } = useAppTheme()

  return (
    <div className={style.sidebar} data-theme={themeSlug}>
      <FunctionSelector />
      <TransformSection />
    </div>
  )
}
