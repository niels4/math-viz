import { useAtom } from "jotai"
import { atomWithStorage, createJSONStorage } from "jotai/utils"
import { useMemo } from "react"

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
export const themeAtom = atomWithStorage<ThemeSlug>("mathviz-theme", DEFAULT_SLUG, validatedStorage, {
  getOnInit: true,
})

/** Theme colours as canvas code needs them: each one a plain, resolved colour. */
export type ThemeColors = {
  background: string
  foreground: string
  foregroundMuted: string
  chartLine: string
  chartAccent: string
  chartGrid: string
  chartGridMajor: string
  chartAxis: string
  chartPoint1: string
  chartPoint2: string
  curveGlow: string
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

export type ThemeVars = ThemeColors & {
  /** Blur radius of the curve glow in px (`--sig-glow-radius`). */
  glowRadius: number
}

const themeColorMapping: Record<string, keyof ThemeColors> = {
  "--background": "background",
  "--foreground": "foreground",
  "--foreground-muted": "foregroundMuted",
  "--chart-line": "chartLine",
  "--chart-accent": "chartAccent",
  "--chart-grid": "chartGrid",
  "--chart-grid-major": "chartGridMajor",
  "--chart-axis": "chartAxis",
  "--chart-point-1": "chartPoint1",
  "--chart-point-2": "chartPoint2",
  "--sig-curve-glow": "curveGlow",
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

// Each colour token goes through a probe's computed `color`, so aliases and
// color-mix() tokens reach the canvas as plain colours it can parse.
const readVarsForClass = (className: string): ThemeVars => {
  const colors: Partial<ThemeColors> = {}
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
  const glowRadius = Number.parseFloat(cs.getPropertyValue("--sig-glow-radius"))
  el.remove()
  return { ...(colors as ThemeColors), glowRadius: Number.isFinite(glowRadius) ? glowRadius : 0 }
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
