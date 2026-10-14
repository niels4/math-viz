import { useAtom, atom, getDefaultStore } from "jotai"
import { atomWithStorage, createJSONStorage } from "jotai/utils"
import { useMemo } from "react"

import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"
import tealTheme from "#src/style/themes/mathviz_clean_teal.module.css"
import warmTheme from "#src/style/themes/mathviz_educational_warm.module.css"
import violetTheme from "#src/style/themes/mathviz_midnight_violet.module.css"
import sageTheme from "#src/style/themes/mathviz_sage_editorial.module.css"
import tronTheme from "#src/style/themes/mathviz_tron_cyan.module.css"

const atomStore = getDefaultStore()

export type SystemColorScheme = "dark" | "light"

export type LightDarkOptionSlug = "system" | SystemColorScheme

const systemColorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)")
const getSystemColorScheme = (query: MediaQueryList | MediaQueryListEvent): SystemColorScheme =>
  query.matches ? "dark" : "light"

const initialSystemColorScheme = getSystemColorScheme(systemColorSchemeQuery)

export const systemColorSchemeAtom = atom(initialSystemColorScheme)

systemColorSchemeQuery.addEventListener("change", (e) => {
  const newScheme = getSystemColorScheme(e)
  atomStore.set(systemColorSchemeAtom, newScheme)
})

export const DARK_THEME_SLUGS = ["arctic-ice", "tron-cyan", "midnight-violet"] as const
export const LIGHT_THEME_SLUGS = ["clean-teal", "educational-warm", "sage-editorial"] as const

const DEFAULT_THEME = DARK_THEME_SLUGS[1]

export type ThemeSlug = (typeof DARK_THEME_SLUGS)[number] | (typeof LIGHT_THEME_SLUGS)[number]

export type ThemeDef = {
  label: string
  className: string
}

export const appThemes: Record<ThemeSlug, ThemeDef> = {
  "arctic-ice": { label: "Arctic Ice", className: arcticTheme.theme },
  "tron-cyan": { label: "Tron Cyan", className: tronTheme.theme },
  "midnight-violet": { label: "Midnight Violet", className: violetTheme.theme },
  "clean-teal": { label: "Clean Teal", className: tealTheme.theme },
  "educational-warm": { label: "Educational Warm", className: warmTheme.theme },
  "sage-editorial": { label: "Sage Editorial", className: sageTheme.theme },
} as const

export const isThemeSlug = (slug: string | undefined | null): slug is ThemeSlug => {
  if (slug == null) {
    return false
  }
  return Object.hasOwn(appThemes, slug)
}

const jsonStorage = createJSONStorage<ThemeSlug>(() => localStorage)

const validatedStorage = {
  getItem: (key: string, initialValue: ThemeSlug): ThemeSlug => {
    try {
      const stored = jsonStorage.getItem(key, initialValue)
      return isThemeSlug(stored) ? stored : initialValue
    } catch {
      return initialValue
    }
  },
  setItem: (key: string, value: ThemeSlug): void => {
    jsonStorage.setItem(key, value)
  },
  removeItem: (key: string): void => {
    jsonStorage.removeItem(key)
  },
  subscribe: (key: string, callback: (value: ThemeSlug) => void, initialValue: ThemeSlug) => {
    if (jsonStorage.subscribe === undefined) {
      return undefined
    }
    return jsonStorage.subscribe(
      key,
      (value) => {
        callback(isThemeSlug(value) ? value : initialValue)
      },
      initialValue,
    )
  },
}

/**
 * Shared theme setting. Any view can `useAtomValue(themeAtom)` to read
 * or `useSetAtom(themeAtom)` to write — no prop drilling, no context.
 * Persisted to localStorage so the choice survives reloads.
 */
export const themeAtom = atomWithStorage<ThemeSlug>("mathviz-theme", DEFAULT_THEME, validatedStorage, {
  getOnInit: true,
})

/** Theme colours as canvas code needs them: each one a plain, resolved colour. */
export type ThemeVars = {
  background: string
  foreground: string
  foregroundMuted: string
  card: string
  primary: string
  chartLine: string
  chartAccent: string
  chartGrid: string
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

/** A canvas colour as CSS, so DOM parts match the canvas's inks: "chartLine" → "var(--chart-line)". */
export const themeColorVar = (key: keyof ThemeVars): string => {
  const cssVar = Object.keys(themeColorMapping).find((name) => themeColorMapping[name] === key)
  return cssVar === undefined ? "currentcolor" : `var(${cssVar})`
}

// Each colour token goes through a probe's computed `color`, so aliases and
// color-mix() tokens reach the canvas as plain colours it can parse.
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
  const [themeSlug, setThemeSlug] = useAtom(themeAtom)
  const selection = appThemes[themeSlug]
  const themeVars = useMemo(() => readVarsForClass(selection.className), [selection.className])

  return {
    themeSlug,
    setThemeSlug,
    themeClass: selection.className,
    themeLabel: selection.label,
    themeVars,
  }
}
