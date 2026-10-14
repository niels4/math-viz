import { useId } from "react"

import { GearIcon } from "#src/components/icons/icons.tsx"

import style from "./SettingsMenu.module.css"

export const SettingsMenu = () => {
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
