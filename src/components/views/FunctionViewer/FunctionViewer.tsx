import { useId, type ReactNode } from "react"

import { GearIcon, Logo } from "#src/components/icons/icons.tsx"

import style from "./FunctionViewer.module.css"

const SettingsMenu = () => {
  const id = useId()
  const menuId = `settings-menu-${id}`
  return (
    <>
      <button className={style.settings_menu_button} popoverTarget={menuId}>
        <GearIcon />
      </button>
      <div className={style.settings_menu} id={menuId} popover="auto">
        Setting menu!
      </div>
    </>
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
      <SettingsMenu />
    </div>
  )
}

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

const SideBar = () => {
  return <div className={style.sidebar}>Sidebar!</div>
}

export const FunctionViewer = () => {
  return (
    <Page>
      <TopBar />
      <SideBar />
    </Page>
  )
}
