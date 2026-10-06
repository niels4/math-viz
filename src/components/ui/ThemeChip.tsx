import { useAppTheme } from "#src/state/useAppTheme.ts"

import chipStyles from "./ThemeChip.module.css"

// Names the live theme (figma0 top-bar-v2: the chip binds meta/theme-label).
// A label, not a control: the settings menu switches themes.
export function ThemeChip() {
  const { themeLabel } = useAppTheme()
  return (
    <p className={chipStyles.chip} data-testid="theme-chip">
      <span className={chipStyles.dot} aria-hidden="true" />
      <span className={chipStyles.hidden}>Theme: </span>
      {themeLabel}
    </p>
  )
}
