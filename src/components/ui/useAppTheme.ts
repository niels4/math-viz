import { useAtom } from "jotai"

import { themeAtom } from "#src/state/theme.ts"
import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"
import tealTheme from "#src/style/themes/mathviz_clean_teal.module.css"
import warmTheme from "#src/style/themes/mathviz_educational_warm.module.css"
import violetTheme from "#src/style/themes/mathviz_midnight_violet.module.css"
import sageTheme from "#src/style/themes/mathviz_sage_editorial.module.css"
import tronTheme from "#src/style/themes/mathviz_tron_cyan.module.css"

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
