import { GearIcon, Logo } from "#src/components/icons/icons.tsx"

import style from "./_root.page.module.css"

const ThemeSwitcher = () => {
  return (
    <button className={style.theme_switcher_button}>
      <GearIcon />
    </button>
  )
}

const RootPage = () => {
  return (
    <div className={style.page} data-testid="root-view">
      <div className={style.top_bar}>
        <Logo />
        <h2 className={style.wordmark}>MathViz</h2>
        <ThemeSwitcher />
      </div>
    </div>
  )
}

export default RootPage
