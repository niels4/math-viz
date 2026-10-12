import { atom, useAtomValue, useSetAtom } from "jotai"
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

export type DarkThemeSlug = (typeof DARK_THEME_SLUGS)[number]
export type LightThemeSlug = (typeof LIGHT_THEME_SLUGS)[number]
export type ThemeSlug = DarkThemeSlug | LightThemeSlug

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

const isDarkSlug = (value: unknown): value is DarkThemeSlug =>
  (DARK_THEME_SLUGS as readonly unknown[]).includes(value)

const isLightSlug = (value: unknown): value is LightThemeSlug =>
  (LIGHT_THEME_SLUGS as readonly unknown[]).includes(value)

/** What the Appearance toggle sets: follow the system, or always light or always dark. */
export type ColorMode = "system" | "light" | "dark"

/** Light or dark: what the mode gives, or in System what the system gives. */
export type ColorScheme = "light" | "dark"

const isColorMode = (value: unknown): value is ColorMode =>
  value === "system" || value === "light" || value === "dark"

/**
 * What is stored (figma0 SM · Spec › Data shape, D4): the mode, and one
 * theme per scheme, as GitHub keeps a day and a night theme. System shows
 * the pick for the scheme the system gives and switches with it.
 */
export type ThemePrefs = { mode: ColorMode; dark: DarkThemeSlug; light: LightThemeSlug }

/** D5: System; Arctic Ice for dark, as before; Clean Teal, Arctic Ice in light, for light. */
export const DEFAULT_PREFS: ThemePrefs = { mode: "system", dark: "arctic-ice", light: "clean-teal" }

/** Where the preferences live in localStorage (JSON `ThemePrefs`). */
export const APPEARANCE_KEY = "mathviz-appearance"

/** Where the old menu kept its one theme, a JSON slug: carried over once, then removed. */
export const LEGACY_THEME_KEY = "mathviz-theme"

export const schemeOf = (slug: ThemeSlug): ColorScheme => (isDarkSlug(slug) ? "dark" : "light")

/** The scheme in use: the mode's, or in System the system's. */
export const schemeFor = (mode: ColorMode, systemScheme: ColorScheme): ColorScheme =>
  mode === "system" ? systemScheme : mode

/** The prefs with `slug` picked for its scheme. */
export const withTheme = (prefs: ThemePrefs, slug: ThemeSlug): ThemePrefs =>
  isDarkSlug(slug) ? { ...prefs, dark: slug } : { ...prefs, light: slug }

/**
 * D15, for the controls that list every theme (ThemeSwitcher, the Alpha's
 * menu): the prefs with `slug` picked and shown. The mode changes only when
 * the pick would otherwise stay hidden, so System survives a pick that
 * matches the system.
 */
export const showingTheme = (prefs: ThemePrefs, slug: ThemeSlug, systemScheme: ColorScheme): ThemePrefs => {
  const scheme = schemeOf(slug)
  const mode = scheme === schemeFor(prefs.mode, systemScheme) ? prefs.mode : scheme
  return { ...withTheme(prefs, slug), mode }
}

/** Stored prefs as read: each field checked, a missing or unknown one taking its default. */
export const parsePrefs = (stored: unknown): ThemePrefs => {
  const fields = typeof stored === "object" && stored !== null ? (stored as Record<string, unknown>) : {}
  const mode = fields["mode"]
  const dark = fields["dark"]
  const light = fields["light"]
  if (isColorMode(mode) && isDarkSlug(dark) && isLightSlug(light) && Object.keys(fields).length === 3) {
    // Valid as stored: the same object, so a re-read changes nothing.
    return fields as ThemePrefs
  }
  return {
    mode: isColorMode(mode) ? mode : DEFAULT_PREFS.mode,
    dark: isDarkSlug(dark) ? dark : DEFAULT_PREFS.dark,
    light: isLightSlug(light) ? light : DEFAULT_PREFS.light,
  }
}

/**
 * The old menu's theme carried over (spec › Migration): a saved slug keeps
 * showing, so its scheme becomes the mode and the other scheme gets its
 * default. Anything else gives the defaults, and the system decides.
 */
export const migrateLegacy = (legacy: unknown): ThemePrefs =>
  typeof legacy === "string" && isThemeSlug(legacy)
    ? withTheme({ ...DEFAULT_PREFS, mode: schemeOf(legacy) }, legacy)
    : DEFAULT_PREFS

const json = createJSONStorage<unknown>(() => localStorage)

// Each read checks the fields. The first read with no prefs stored moves
// the old key over, once; storage that throws (a private window) gives the
// defaults. Another tab's change comes through checked as well.
const prefsStorage = {
  getItem: (key: string, initialValue: ThemePrefs): ThemePrefs => {
    try {
      if (localStorage.getItem(key) !== null) {
        return parsePrefs(json.getItem(key, initialValue))
      }
      const prefs = migrateLegacy(json.getItem(LEGACY_THEME_KEY, null))
      localStorage.setItem(key, JSON.stringify(prefs))
      localStorage.removeItem(LEGACY_THEME_KEY)
      return prefs
    } catch {
      return initialValue
    }
  },
  setItem: (key: string, value: ThemePrefs): void => {
    json.setItem(key, value)
  },
  removeItem: (key: string): void => {
    json.removeItem(key)
  },
  subscribe: (key: string, callback: (value: ThemePrefs) => void, initialValue: ThemePrefs) => {
    if (json.subscribe === undefined) {
      return undefined
    }
    return json.subscribe(key, (value) => callback(parsePrefs(value)), initialValue)
  },
}

/**
 * The theme preferences, shared and persisted. Read the theme in use
 * through `useAppTheme`, which derives it from these and the system.
 */
export const prefsAtom = atomWithStorage<ThemePrefs>(APPEARANCE_KEY, DEFAULT_PREFS, prefsStorage, {
  getOnInit: true,
})

const SCHEME_QUERY = "(prefers-color-scheme: dark)"

/** The system's scheme now; dark where there is no matchMedia (jsdom, a server render). */
const readSystemScheme = (): ColorScheme =>
  typeof matchMedia !== "function" || matchMedia(SCHEME_QUERY).matches ? "dark" : "light"

/**
 * The system's scheme, followed live: while anything reads it, a change of
 * the OS's appearance switches the theme in System without a reload.
 */
export const systemSchemeAtom = atom<ColorScheme>(readSystemScheme())
systemSchemeAtom.onMount = (set) => {
  set(readSystemScheme())
  if (typeof matchMedia !== "function") {
    return
  }
  const query = matchMedia(SCHEME_QUERY)
  const onChange = (event: MediaQueryListEvent) => set(event.matches ? "dark" : "light")
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** D15's pick: stored for its scheme and shown, against the system's scheme as it is now. */
const showThemeAtom = atom(null, (get, set, slug: ThemeSlug) => {
  set(prefsAtom, showingTheme(get(prefsAtom), slug, get(systemSchemeAtom)))
})

/** Theme colours as canvas code needs them: each one a plain, resolved colour. */
export type ThemeColors = {
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
  /** The readout font-family list (`--sig-readout-font`): Roboto Mono, STIX Two Text in sage-editorial. */
  readoutFont: string
}

/** The readout family where a theme names none. */
const DEFAULT_READOUT_FONT = `"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace`

const themeColorMapping: Record<string, keyof ThemeColors> = {
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

/** A canvas colour as CSS, so DOM parts match the canvas's inks: "chartPoint1" → "var(--chart-point-1)". */
export const themeColorVar = (key: keyof ThemeColors): string => {
  const cssVar = Object.keys(themeColorMapping).find((name) => themeColorMapping[name] === key)
  return cssVar === undefined ? "currentcolor" : `var(${cssVar})`
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
  const readoutFont = cs.getPropertyValue("--sig-readout-font").trim()
  el.remove()
  return {
    ...(colors as ThemeColors),
    glowRadius: Number.isFinite(glowRadius) ? glowRadius : 0,
    readoutFont: readoutFont === "" ? DEFAULT_READOUT_FONT : readoutFont,
  }
}

/**
 * The theme in use and the preferences behind it. `themeSlug`, `themeClass`,
 * `themeLabel` and `themeVars` name and resolve the shown theme; `setMode`
 * and `setTheme` are the settings menu's (a theme is picked within the
 * scheme in use); `setThemeSlug` shows any theme (D15).
 */
export function useAppTheme() {
  const prefs = useAtomValue(prefsAtom)
  const setPrefs = useSetAtom(prefsAtom)
  const setThemeSlug = useSetAtom(showThemeAtom)
  const systemScheme = useAtomValue(systemSchemeAtom)
  const scheme = schemeFor(prefs.mode, systemScheme)
  const themeSlug: ThemeSlug = prefs[scheme]
  const selection = appThemes[themeSlug]
  const themeVars = useMemo(() => readVarsForClass(selection.className), [selection.className])

  return {
    themeSlug,
    themeClass: selection.className,
    themeLabel: selection.label,
    themeVars,
    prefs,
    scheme,
    systemScheme,
    setMode: (mode: ColorMode) => setPrefs((prev) => ({ ...prev, mode })),
    setTheme: (slug: ThemeSlug) => setPrefs((prev) => withTheme(prev, slug)),
    setThemeSlug,
  }
}
