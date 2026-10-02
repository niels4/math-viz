import { appThemes, useAppTheme, type ThemeSlug } from "#src/state/useAppTheme.ts"

import switcherStyles from "./ThemeSwitcher.module.css"

export function ThemeSwitcher() {
  const { themeSlug, setThemeSlug } = useAppTheme()
  return (
    <div className={switcherStyles.theme_group} role="group" aria-label="Theme" data-testid="theme-switcher">
      {Object.entries(appThemes).map(([slug, { label }]) => (
        <button
          key={slug}
          type="button"
          aria-pressed={slug === themeSlug}
          data-testid={`theme-${slug}`}
          className={
            slug === themeSlug
              ? `${switcherStyles.theme_btn} ${switcherStyles.theme_btn_active}`
              : `${switcherStyles.theme_btn} ${switcherStyles.theme_btn_idle}`
          }
          onClick={() => setThemeSlug(slug as ThemeSlug)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
