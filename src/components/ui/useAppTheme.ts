import { useAtom } from "jotai"

import { themeAtom } from "#src/state/theme.ts"
import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"
import tealTheme from "#src/style/themes/mathviz_clean_teal.module.css"
import warmTheme from "#src/style/themes/mathviz_educational_warm.module.css"
import violetTheme from "#src/style/themes/mathviz_midnight_violet.module.css"
import sageTheme from "#src/style/themes/mathviz_sage_editorial.module.css"
import tronTheme from "#src/style/themes/mathviz_tron_cyan.module.css"

export const APP_THEMES = [
  { slug: "arctic-ice", label: "Arctic Ice", styles: arcticTheme },
  { slug: "tron-cyan", label: "Tron Cyan", styles: tronTheme },
  { slug: "midnight-violet", label: "Midnight Violet", styles: violetTheme },
  { slug: "clean-teal", label: "Clean Teal", styles: tealTheme },
  { slug: "educational-warm", label: "Educational Warm", styles: warmTheme },
  { slug: "sage-editorial", label: "Sage Editorial", styles: sageTheme },
] as const

export type AppThemeStyles = (typeof APP_THEMES)[number]["styles"]

export function useAppTheme() {
  const [themeSlug, setThemeSlug] = useAtom(themeAtom)
  const activeTheme = APP_THEMES.find((theme) => theme.slug === themeSlug)?.styles ?? arcticTheme
  const activeThemeLabel = APP_THEMES.find((theme) => theme.slug === themeSlug)?.label ?? "Arctic Ice"
  return { themes: APP_THEMES, themeSlug, setThemeSlug, activeTheme, activeThemeLabel }
}
