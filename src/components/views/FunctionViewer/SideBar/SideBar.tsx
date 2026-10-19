import { useAppTheme } from "#src/state/useAppTheme.ts"

import { FunctionSelector } from "./FunctionSelector"
import style from "./SideBar.module.css"

export const SideBar = () => {
  const { themeSlug } = useAppTheme()

  return (
    <div className={style.sidebar} data-theme={themeSlug}>
      <FunctionSelector />
    </div>
  )
}
