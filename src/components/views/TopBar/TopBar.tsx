import { Logo } from "#src/components/icons/icons.tsx"

import style from "./TopBar.module.css"
import { TopBarActions } from "./TopBarActions"

type Props = {
  title: string
  subtitle: string
  href?: string
}

export const TopBar = ({ title, subtitle, href }: Props) => {
  return (
    <div className={style.top_bar}>
      <a href="#" className={style.wordmark} aria-label="MathViz home">
        <Logo />
        <h2 className={style.wordmark_text}>MathViz</h2>
      </a>
      <div className={style.divider} />
      <div className={style.heading}>
        <h1 className={style.title}>
          {href === undefined ? (
            title
          ) : (
            <a href={href} className={style.title_link}>
              {title}
            </a>
          )}
        </h1>
        <div className={style.subtitle}>{subtitle}</div>
      </div>
      <TopBarActions />
    </div>
  )
}
