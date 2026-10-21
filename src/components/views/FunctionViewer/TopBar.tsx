import { Logo } from "#src/components/icons/icons.tsx"

import { TopBarActions } from "../TopBar/TopBarActions"
import { HelpButton } from "./Help/HelpButton"
import style from "./TopBar.module.css"

export const TopBar = () => {
  return (
    <div className={style.top_bar}>
      <a href="#" className={style.wordmark} aria-label="MathViz home">
        <Logo />
        <h2 className={style.wordmark_text}>MathViz</h2>
      </a>
      <div className={style.divider} />
      <div className={style.heading}>
        <h1 className={style.title}>Function Viewer</h1>
        <div className={style.subtitle}>Functions · Transformations</div>
      </div>
      <TopBarActions>
        <HelpButton />
      </TopBarActions>
    </div>
  )
}
