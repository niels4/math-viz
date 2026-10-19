import { atom, getDefaultStore, useAtomValue, useSetAtom } from "jotai"
import { atomWithStorage, createJSONStorage } from "jotai/utils"
import { useCallback, useMemo } from "react"

import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"
import tealTheme from "#src/style/themes/mathviz_clean_teal.module.css"
import warmTheme from "#src/style/themes/mathviz_educational_warm.module.css"
import violetTheme from "#src/style/themes/mathviz_midnight_violet.module.css"
import sageTheme from "#src/style/themes/mathviz_sage_editorial.module.css"
import tronTheme from "#src/style/themes/mathviz_tron_cyan.module.css"

const atomStore = getDefaultStore()

export type SystemColorScheme = "dark" | "light"

export type LightDarkOptionSlug = "system" | SystemColorScheme

export const DARK_THEME_SLUGS = ["arctic-ice", "tron-cyan", "midnight-violet"] as const
export const LIGHT_THEME_SLUGS = ["clean-teal", "educational-warm", "sage-editorial"] as const

export type DarkThemeSlug = (typeof DARK_THEME_SLUGS)[number]
export type LightThemeSlug = (typeof LIGHT_THEME_SLUGS)[number]
export type ThemeSlug = DarkThemeSlug | LightThemeSlug

export const isLightDarkOptionSlug = (slug: unknown): slug is LightDarkOptionSlug =>
  slug === "system" || slug === "dark" || slug === "light"

export const isDarkThemeSlug = (slug: unknown): slug is DarkThemeSlug =>
  typeof slug === "string" && (DARK_THEME_SLUGS as readonly string[]).includes(slug)

export const isLightThemeSlug = (slug: unknown): slug is LightThemeSlug =>
  typeof slug === "string" && (LIGHT_THEME_SLUGS as readonly string[]).includes(slug)

const storageFor = <T>(isValid: (value: unknown) => value is T) => {
  const jsonStorage = createJSONStorage<T>(() => localStorage)
  return {
    getItem: (key: string, initialValue: T): T => {
      try {
        const stored = jsonStorage.getItem(key, initialValue)
        return isValid(stored) ? stored : initialValue
      } catch {
        return initialValue
      }
    },
    setItem: (key: string, value: T): void => {
      jsonStorage.setItem(key, value)
    },
    removeItem: (key: string): void => {
      jsonStorage.removeItem(key)
    },
    subscribe: (key: string, callback: (value: T) => void, initialValue: T) => {
      if (jsonStorage.subscribe === undefined) {
        return undefined
      }
      return jsonStorage.subscribe(
        key,
        (value) => {
          callback(isValid(value) ? value : initialValue)
        },
        initialValue,
      )
    },
  }
}

const systemColorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)")
const getSystemColorScheme = (query: MediaQueryList | MediaQueryListEvent): SystemColorScheme =>
  query.matches ? "dark" : "light"

const initialSystemColorScheme = getSystemColorScheme(systemColorSchemeQuery)

export const systemColorSchemeAtom = atom(initialSystemColorScheme)

systemColorSchemeQuery.addEventListener("change", (e) => {
  const newScheme = getSystemColorScheme(e)
  atomStore.set(systemColorSchemeAtom, newScheme)
})

export const selectedLightDarkAtom = atomWithStorage<LightDarkOptionSlug>(
  "mathviz-light-dark",
  "system",
  storageFor(isLightDarkOptionSlug),
  { getOnInit: true },
)
export const selectedDarkThemeAtom = atomWithStorage<DarkThemeSlug>(
  "mathviz-dark-theme",
  DARK_THEME_SLUGS[0],
  storageFor(isDarkThemeSlug),
  { getOnInit: true },
)
export const selectedLightThemeAtom = atomWithStorage<LightThemeSlug>(
  "mathviz-light-theme",
  LIGHT_THEME_SLUGS[0],
  storageFor(isLightThemeSlug),
  { getOnInit: true },
)

const appThemeAtom = atom<ThemeSlug>((get) => {
  const systemColorScheme = get(systemColorSchemeAtom)
  const lightDark = get(selectedLightDarkAtom)
  const resolvedLightDark: SystemColorScheme = lightDark === "system" ? systemColorScheme : lightDark
  return resolvedLightDark === "dark" ? get(selectedDarkThemeAtom) : get(selectedLightThemeAtom)
})

export type ThemeDef = {
  label: string
  className: string
}

export const appThemeClasses: Record<ThemeSlug, string> = {
  "arctic-ice": arcticTheme.theme,
  "tron-cyan": tronTheme.theme,
  "midnight-violet": violetTheme.theme,
  "clean-teal": tealTheme.theme,
  "educational-warm": warmTheme.theme,
  "sage-editorial": sageTheme.theme,
} as const

export const isThemeSlug = (slug: string | undefined | null): slug is ThemeSlug => {
  if (slug == null) {
    return false
  }
  return Object.hasOwn(appThemeClasses, slug)
}

export type ThemeVars = {
  background: string
  foreground: string
  foregroundMuted: string
  card: string
  primary: string
  chartLine: string
  chartAccent: string
  chartGrid: string
  chartGridMajor: string
  chartAxis: string
  ordinal01: string
  ordinal02: string
  ordinal03: string
  ordinal04: string
  ordinal05: string
  ordinal06: string
  ordinal07: string
  ordinal08: string
  ordinal09: string
  ordinal10: string
  ordinal11: string
  ordinal12: string
}

const themeColorMapping: Record<string, keyof ThemeVars> = {
  "--background": "background",
  "--foreground": "foreground",
  "--foreground-muted": "foregroundMuted",
  "--card": "card",
  "--primary": "primary",
  "--chart-line": "chartLine",
  "--chart-accent": "chartAccent",
  "--chart-grid": "chartGrid",
  "--chart-grid-major": "chartGridMajor",
  "--chart-axis": "chartAxis",
  "--ordinal-01": "ordinal01",
  "--ordinal-02": "ordinal02",
  "--ordinal-03": "ordinal03",
  "--ordinal-04": "ordinal04",
  "--ordinal-05": "ordinal05",
  "--ordinal-06": "ordinal06",
  "--ordinal-07": "ordinal07",
  "--ordinal-08": "ordinal08",
  "--ordinal-09": "ordinal09",
  "--ordinal-10": "ordinal10",
  "--ordinal-11": "ordinal11",
  "--ordinal-12": "ordinal12",
}

export const themeColorVar = (key: keyof ThemeVars): string => {
  const cssVar = Object.keys(themeColorMapping).find((name) => themeColorMapping[name] === key)
  return cssVar === undefined ? "currentcolor" : `var(${cssVar})`
}

const readVarsForClass = (className: string): ThemeVars => {
  const colors: Partial<ThemeVars> = {}
  const el = document.createElement("div")
  el.className = className
  el.setAttribute("aria-hidden", "true")
  el.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;"
  document.body.appendChild(el)
  const cs = getComputedStyle(el)
  for (const [cssVar, outKey] of Object.entries(themeColorMapping)) {
    el.style.color = `var(${cssVar})`
    colors[outKey] = cs.color
  }
  el.remove()
  return colors as ThemeVars
}

export function useAppTheme() {
  const systemColorScheme = useAtomValue(systemColorSchemeAtom)
  const lightDark = useAtomValue(selectedLightDarkAtom)
  const setDarkThemeSlug = useSetAtom(selectedDarkThemeAtom)
  const setLightThemeSlug = useSetAtom(selectedLightThemeAtom)
  const themeSlug = useAtomValue(appThemeAtom)

  const setThemeSlug = useCallback(
    (slug: ThemeSlug) => {
      const resolvedLightDark: SystemColorScheme = lightDark === "system" ? systemColorScheme : lightDark
      if (resolvedLightDark === "dark") {
        setDarkThemeSlug(slug as DarkThemeSlug)
      } else {
        setLightThemeSlug(slug as LightThemeSlug)
      }
    },
    [systemColorScheme, lightDark, setDarkThemeSlug, setLightThemeSlug],
  )

  const themeClass = appThemeClasses[themeSlug]
  const themeVars = useMemo(() => readVarsForClass(themeClass), [themeClass])

  return {
    themeSlug,
    setThemeSlug,
    themeClass,
    themeVars,
  }
}
