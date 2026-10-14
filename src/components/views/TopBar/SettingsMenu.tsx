import cn from "classnames"
import { useAtomValue } from "jotai"
import { useId, useState } from "react"

import { GearIcon } from "#src/components/icons/icons.tsx"
import {
  appThemes,
  DARK_THEME_SLUGS,
  LIGHT_THEME_SLUGS,
  systemColorSchemeAtom,
  useAppTheme,
  type LightDarkOptionSlug,
  type SystemColorScheme,
} from "#src/state/useAppTheme"
import { slugToLabel } from "#src/util/format.ts"

import { CheckIcon, DarkIcon, LightIcon, SystemIcon } from "./icons"
import style from "./SettingsMenu.module.css"

const lightDarkOptions: Record<LightDarkOptionSlug, React.ComponentType> = {
  system: SystemIcon,
  dark: DarkIcon,
  light: LightIcon,
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

type LightDarkSelectorProps = {
  value: LightDarkOptionSlug
  setValue: (value: LightDarkOptionSlug) => void
}
const LightDarkSelector = ({ value, setValue }: LightDarkSelectorProps) => {
  return (
    <fieldset className={style.light_dark_selector}>
      <legend className={style.light_dark_title}>Appearance</legend>

      <div className={style.light_dark_buttons}>
        {Object.entries(lightDarkOptions).map(([key, Icon]) => {
          return (
            <label key={key} className={style.light_dark_input}>
              <input
                type="radio"
                name="lightDark"
                value={key}
                checked={key === value}
                onChange={() => setValue(key as LightDarkOptionSlug)}
              />
              <Icon />
              {slugToLabel(key)}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function ThemeSwatch() {
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true" className={style.theme_swatch}>
      <path className={style.settings_swatch_curve} d="M6 4.63Q15 25.37 24 4.63" />
      <circle className={style.settings_swatch_point} cx="21" cy="10.39" r="2.25" />
    </svg>
  )
}

export const SettingsMenu = () => {
  const { themeSlug } = useAppTheme()
  const [lightDark, setLightDark] = useState<LightDarkOptionSlug>("system")
  const systemColorScheme = useAtomValue(systemColorSchemeAtom)

  const selectionMessage = getLightDarkSelectionMessage(lightDark, systemColorScheme)
  const resolvedLightDark: SystemColorScheme = lightDark === "system" ? systemColorScheme : lightDark

  const id = useId()
  const menuId = `settings-menu-${id}`

  const themeSlugs = resolvedLightDark === "dark" ? DARK_THEME_SLUGS : LIGHT_THEME_SLUGS

  return (
    <>
      <button className={style.settings_menu_button} popoverTarget={menuId}>
        <GearIcon />
      </button>

      <div className={style.settings_menu} id={menuId} popover="auto">
        <LightDarkSelector {...{ value: lightDark, setValue: setLightDark }} />
        <div className={style.light_dark_inner}>
          <div className={style.light_dark_message}>{selectionMessage}</div>
          <div className={style.light_dark_subtitle}>{resolvedLightDark} theme</div>
          <div className={style.theme_selector}>
            {themeSlugs.map((slug) => {
              const selected = slug === themeSlug

              return (
                <div
                  key={slug}
                  className={cn(style.theme_row, appThemes[slug].className, { [style.selected]: selected })}
                >
                  <ThemeSwatch />
                  {slugToLabel(slug)}
                  {selected && (
                    <div className={style.selected_check}>
                      <CheckIcon />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
