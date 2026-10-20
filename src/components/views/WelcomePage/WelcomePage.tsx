import cn from "classnames"
import { useRef, type CSSProperties } from "react"

import { useDevicePixelRatio } from "#src/components/hooks/useDevicePixelRatio.ts"
import { ArrowRightIcon, Logo } from "#src/components/icons/icons.tsx"
import { useAppTheme } from "#src/state/useAppTheme.ts"
import { param_colours } from "#src/style/param_colours.module.css"

import { SettingsMenu } from "../TopBar/SettingsMenu"
import { HeroPlane } from "./HeroPlane"
import { useFitScale } from "./useFitScale"
import style from "./WelcomePage.module.css"

const hintParams = ["a", "k", "b", "h"] as const

const designWidth = 1440
const designHeight = 900
const paperStep = 50

export const WelcomePage = () => {
  const { themeSlug } = useAppTheme()
  const ref = useRef<HTMLDivElement | null>(null)
  const fitted = useFitScale(ref, designWidth, designHeight)
  const stepPixels = paperStep * useDevicePixelRatio()
  const fit = fitted < 1 ? Math.floor(fitted * stepPixels + 1e-9) / stepPixels : 1

  return (
    <div
      ref={ref}
      className={cn(style.page, param_colours)}
      data-theme={themeSlug}
      data-testid="root-view"
      style={{ "--fit": fit } as CSSProperties}
    >
      <div className={style.top_bar}>
        <Logo />
        <SettingsMenu />
      </div>
      <div className={style.frame}>
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
            <div className={style.paper_x} />
            <div className={style.paper_y} />
            <div className={style.light_top} />
            <div className={style.light_body} />
            <HeroPlane />
          </div>
        </main>
        <a href="#dev" className={style.dev_link}>
          Developer pages
          <ArrowRightIcon />
        </a>
      </div>
    </div>
  )
}
