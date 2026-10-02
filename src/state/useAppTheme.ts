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

const DEFAULT_SLUG = DARK_THEME_SLUGS[0]

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

const isThemeSlug = (slug: string): slug is ThemeSlug => {
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
export const themeAtom = atomWithStorage<ThemeSlug>("mathviz-theme", DEFAULT_SLUG, validatedStorage, {
  getOnInit: true,
})

export function useAppTheme() {
  const [themeSlug, setThemeSlug] = useAtom(themeAtom)
  const selection = appThemes[themeSlug]
  return {
    themeSlug,
    setThemeSlug,
    themeClass: selection.className,
    themeLabel: selection.label,
  }
}
