import cn from "classnames"

import { ArrowRightIcon, Logo } from "#src/components/icons/icons.tsx"
import { useAppTheme } from "#src/state/useAppTheme.ts"
import { param_colours } from "#src/style/param_colours.module.css"
import { slugToLabel } from "#src/util/format.ts"

import { SettingsMenu } from "../TopBar/SettingsMenu"
import { HeroPlane } from "./HeroPlane"
import style from "./WelcomePage.module.css"

const hintParams = ["a", "k", "b", "h"] as const

export const WelcomePage = () => {
  const { themeSlug } = useAppTheme()

  return (
    <div className={cn(style.page, param_colours)} data-theme={themeSlug} data-testid="root-view">
      <div className={style.top_bar}>
        <Logo />
        <div className={style.top_actions}>
          <div className={style.theme_chip} data-testid="theme-chip">
            <span className={style.theme_dot} />
            {slugToLabel(themeSlug)}
          </div>
          <SettingsMenu />
        </div>
      </div>
      <main className={style.content}>
        <div className={style.intro}>
          <h1 className={style.title}>MathViz</h1>
          <p className={style.description}>
            Interactive math visualizations for the browser, built with React, TypeScript and Vite.
          </p>
          <div className={style.actions}>
            <a href="#function-viewer" className={style.cta}>
              Open the Function Viewer
              <ArrowRightIcon />
            </a>
            <p className={style.hint}>
              Pick a function, then drag
              {hintParams.map((param) => (
                <span key={param} className={style.chip} data-param={param}>
                  <var>{param}</var>
                </span>
              ))}
            </p>
          </div>
        </div>
        <div className={style.hero}>
          <HeroPlane />
        </div>
      </main>
    </div>
  )
}
