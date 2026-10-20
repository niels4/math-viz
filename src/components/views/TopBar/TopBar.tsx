import { Logo } from "#src/components/icons/icons.tsx"

import { SettingsMenu } from "./SettingsMenu"
import style from "./TopBar.module.css"

type Props = {
  title: string
  subtitle: string
}

export const TopBar = ({ title, subtitle }: Props) => {
  return (
    <div className={style.top_bar}>
      <a href="#" className={style.wordmark} aria-label="MathViz home">
        <Logo />
        <h2 className={style.wordmark_text}>MathViz</h2>
      </a>
      <div className={style.divider} />
      <div className={style.heading}>
        <h1 className={style.title}>{title}</h1>
        <div className={style.subtitle}>{subtitle}</div>
      </div>
      <SettingsMenu />
    </div>
  )
}
