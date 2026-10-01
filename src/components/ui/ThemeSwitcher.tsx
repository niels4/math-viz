import switcherStyles from "./ThemeSwitcher.module.css"

export type ThemeOption = {
  slug: string
  label: string
}

export function ThemeSwitcher({
  themes,
  activeSlug,
  onSelect,
  primaryClass,
  secondaryClass,
}: {
  themes: ReadonlyArray<ThemeOption>
  activeSlug: string
  onSelect: (slug: string) => void
  primaryClass: string
  secondaryClass: string
}) {
  return (
    <div className={switcherStyles.theme_group} role="group" aria-label="Theme" data-testid="theme-switcher">
      {themes.map((theme) => (
        <button
          key={theme.slug}
          type="button"
          aria-pressed={theme.slug === activeSlug}
          data-testid={`theme-${theme.slug}`}
          className={
            theme.slug === activeSlug
              ? `${primaryClass} ${switcherStyles.theme_btn}`
              : `${secondaryClass} ${switcherStyles.theme_btn}`
          }
          onClick={() => onSelect(theme.slug)}
        >
          {theme.label}
        </button>
      ))}
    </div>
  )
}
