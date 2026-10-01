import { atomWithStorage, createJSONStorage } from "jotai/utils"

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
