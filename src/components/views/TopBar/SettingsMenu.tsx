import { useEffect, useId, useState } from "react"

import { GearIcon } from "#src/components/icons/icons.tsx"

import style from "./SettingsMenu.module.css"

const PlaceholderIcon = () => {
  return <span className={style.icon_placeholder} />
}

type LightDarkSlug = "system" | "dark" | "light"

type OptionWithIcon = {
  label: string
  Icon: React.ComponentType
}

const lightDarkOptions: Record<LightDarkSlug, OptionWithIcon> = {
  system: { label: "System", Icon: PlaceholderIcon },
  dark: { label: "Dark", Icon: PlaceholderIcon },
  light: { label: "Light", Icon: PlaceholderIcon },
} as const

const LightDarkSelector = () => {
  const [lightDark, setLightDark] = useState<LightDarkSlug>("system")

  useEffect(() => {
    console.log("lightdark option:", lightDark)
  }, [lightDark])

  return (
    <fieldset className={style.light_dark_selector}>
      <legend className={style.light_dark_title}>Appearance</legend>

      <div className={style.light_dark_buttons}>
        {Object.entries(lightDarkOptions).map(([key, { label, Icon }]) => {
          return (
            <label key={key} className={style.light_dark_input}>
              <input
                type="radio"
                name="lightDark"
                value={key}
                checked={key === lightDark}
                onChange={() => setLightDark(key as LightDarkSlug)}
              />
              <Icon />
              {label}
            </label>
          )
        })}
      </div>

      <div>{lightDark}</div>
    </fieldset>
  )
}

export const SettingsMenu = () => {
  const id = useId()
  const menuId = `settings-menu-${id}`

  return (
    <>
      <button className={style.settings_menu_button} popoverTarget={menuId}>
        <GearIcon />
      </button>

      <div className={style.settings_menu} id={menuId} popover="auto">
        <LightDarkSelector />
      </div>
    </>
  )
}
