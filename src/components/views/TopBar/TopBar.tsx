import { Logo } from "#src/components/icons/icons.tsx"

import { SettingsMenu } from "./SettingsMenu"
import style from "./TopBar.module.css"

export const TopBar = () => {
  return (
    <div className={style.top_bar}>
      <Logo />
      <h2 className={style.wordmark}>MathViz</h2>
      <div className={style.divider} />
      <div>
        <h1 className={style.title}>Function Viewer</h1>
        <div className={style.subtitle}>Functions · Transformations</div>
      </div>
      <SettingsMenu />
    </div>
  )
}
