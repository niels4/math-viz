import type { ReactNode } from "react"

import { GearIcon, Logo } from "#src/components/icons/icons.tsx"

import style from "./FunctionViewer.module.css"

const ThemeSwitcher = () => {
  return (
    <button className={style.theme_switcher_button}>
      <GearIcon />
    </button>
  )
}

const TopBar = () => {
  return (
    <div className={style.top_bar}>
      <Logo />
      <h2 className={style.wordmark}>MathViz</h2>
      <div className={style.divider} />
      <div>
        <h1 className={style.title}>Function Viewer</h1>
        <div className={style.subtitle}>Functions · Transformations</div>
      </div>
      <ThemeSwitcher />
    </div>
  )
}

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

export const FunctionViewer = () => {
  return (
    <Page>
      <TopBar />
    </Page>
  )
}
