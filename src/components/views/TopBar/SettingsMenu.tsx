import { useAtomValue } from "jotai"
import { useId, useState } from "react"

import { GearIcon } from "#src/components/icons/icons.tsx"
import {
  systemColorSchemeAtom,
  type LightDarkOptionSlug,
  type SystemColorScheme,
} from "#src/state/useAppTheme"

import { DarkIcon, LightIcon, SystemIcon } from "./icons"
import style from "./SettingsMenu.module.css"

type OptionWithIcon = {
  label: string
  Icon: React.ComponentType
}

const lightDarkOptions: Record<LightDarkOptionSlug, OptionWithIcon> = {
  system: { label: "System", Icon: SystemIcon },
  dark: { label: "Dark", Icon: DarkIcon },
  light: { label: "Light", Icon: LightIcon },
} as const

const getLightDarkSelectionMessage = (
  lightDark: LightDarkOptionSlug,
  systemColorScheme: SystemColorScheme,
): string => {
  if (lightDark === "system") {
    return `Your system is ${systemColorScheme} right now.`
  }
  return `Always ${lightDark}.`
}

const LightDarkSelector = () => {
  const systemColorScheme = useAtomValue(systemColorSchemeAtom)
  const [lightDark, setLightDark] = useState<LightDarkOptionSlug>("system")

  const selectionMessage = getLightDarkSelectionMessage(lightDark, systemColorScheme)

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
                onChange={() => setLightDark(key as LightDarkOptionSlug)}
              />
              <Icon />
              {label}
            </label>
          )
        })}
      </div>

      <div>{selectionMessage}</div>
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
