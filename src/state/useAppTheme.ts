import { useAtom } from "jotai"
import { atomWithStorage, createJSONStorage } from "jotai/utils"

import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"
import tealTheme from "#src/style/themes/mathviz_clean_teal.module.css"
import warmTheme from "#src/style/themes/mathviz_educational_warm.module.css"
import violetTheme from "#src/style/themes/mathviz_midnight_violet.module.css"
import sageTheme from "#src/style/themes/mathviz_sage_editorial.module.css"
import tronTheme from "#src/style/themes/mathviz_tron_cyan.module.css"

export const DARK_THEME_SLUGS = ["arctic-ice", "tron-cyan", "midnight-violet"] as const
export const LIGHT_THEME_SLUGS = ["clean-teal", "educational-warm", "sage-editorial"] as const

export type ThemeSlug = (typeof DARK_THEME_SLUGS)[number] | (typeof LIGHT_THEME_SLUGS)[number]

export const THEME_LABELS: Record<ThemeSlug, string> = {
  "arctic-ice": "Arctic Ice",
  "tron-cyan": "Tron Cyan",
  "midnight-violet": "Midnight Violet",
  "clean-teal": "Clean Teal",
  "educational-warm": "Educational Warm",
  "sage-editorial": "Sage Editorial",
}

function isThemeSlug(value: unknown): value is ThemeSlug {
  return (
    value === "arctic-ice" ||
    value === "tron-cyan" ||
    value === "midnight-violet" ||
    value === "clean-teal" ||
    value === "educational-warm" ||
    value === "sage-editorial"
  )
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
    if (jsonStorage.subscribe === undefined) return undefined
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
export const themeAtom = atomWithStorage<ThemeSlug>("mathviz-theme", "arctic-ice", validatedStorage, {
  getOnInit: true,
})

export const APP_THEMES = [
  { slug: "arctic-ice", label: "Arctic Ice", themeClass: arcticTheme.theme },
  { slug: "tron-cyan", label: "Tron Cyan", themeClass: tronTheme.theme },
  { slug: "midnight-violet", label: "Midnight Violet", themeClass: violetTheme.theme },
  { slug: "clean-teal", label: "Clean Teal", themeClass: tealTheme.theme },
  { slug: "educational-warm", label: "Educational Warm", themeClass: warmTheme.theme },
  { slug: "sage-editorial", label: "Sage Editorial", themeClass: sageTheme.theme },
] as const

export function useAppTheme() {
  const [themeSlug, setThemeSlug] = useAtom(themeAtom)
  const selection = APP_THEMES.find((theme) => theme.slug === themeSlug) ?? APP_THEMES[0]
  return {
    themes: APP_THEMES,
    themeSlug,
    setThemeSlug,
    themeClass: selection.themeClass,
    activeThemeLabel: selection.label,
  }
}
