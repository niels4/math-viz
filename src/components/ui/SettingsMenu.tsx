import { useEffect, useRef, useState } from "react"

import { usePresence } from "#src/components/hooks/usePresence.ts"
import { DARK_THEME_SLUGS, LIGHT_THEME_SLUGS, appThemes } from "#src/state/useAppTheme.ts"
import { DURATION_MS, motionCssVars, motionLevel } from "#src/util/motion/motion.ts"

import { useAppTheme } from "../../state/useAppTheme.ts"
import { GearIcon } from "./icons.tsx"
import menuStyles from "./SettingsMenu.module.css"

/** A view's own item in the settings menu, under the themes: "Show the tour again". */
export type SettingsAction = { id: string; label: string; onSelect: () => void }

// The top bar's gear and its menu: the themes, dark then light, and a
// view's own items under them. The menu opens with the enter spring and
// leaves in 120 ms (SettingsMenu.module.css; the motion tokens ride along
// on the wrapper, as on any page); while it leaves it takes no input.
export function SettingsMenu({ actions = [] }: { actions?: readonly SettingsAction[] }) {
  const { themeSlug, setThemeSlug } = useAppTheme()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const presence = usePresence(open, motionLevel() === "none" ? 0 : DURATION_MS.leave)

  useEffect(() => {
    if (!open) {
      return
    }
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (wrapRef.current !== null && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [open])

  const groups = [
    { id: "dark", label: "Dark", slugs: DARK_THEME_SLUGS },
    { id: "light", label: "Light", slugs: LIGHT_THEME_SLUGS },
  ] as const

  return (
    <div ref={wrapRef} className={menuStyles.settings_wrap} style={motionCssVars}>
      <button
        type="button"
        data-testid="settings-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="settings-theme-menu"
        aria-label="Settings"
        className={menuStyles.settings_button}
        onClick={() => setOpen((prev) => !prev)}
      >
        <GearIcon />
      </button>
      {presence !== "closed" ? (
        <div
          id="settings-theme-menu"
          role="menu"
          tabIndex={-1}
          aria-label="Theme settings"
          data-testid="settings-menu"
          data-closing={presence === "closing" || undefined}
          inert={presence === "closing"}
          className={menuStyles.settings_menu}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              setOpen(false)
            }
          }}
        >
          {groups.map((group) => (
            <div key={group.id} role="group" aria-labelledby={`settings-group-${group.id}`}>
              <p id={`settings-group-${group.id}`} className={menuStyles.settings_group_label}>
                {group.label}
              </p>
              {group.slugs.map((slug) => {
                const selected = slug === themeSlug
                return (
                  <button
                    key={slug}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    data-testid={`settings-theme-${slug}`}
                    className={
                      selected
                        ? `${menuStyles.settings_option} ${menuStyles.settings_option_active}`
                        : menuStyles.settings_option
                    }
                    onClick={() => {
                      setThemeSlug(slug)
                      setOpen(false)
                    }}
                  >
                    <span className={menuStyles.settings_check} aria-hidden="true">
                      {selected ? "✓" : ""}
                    </span>
                    {appThemes[slug].label}
                  </button>
                )
              })}
            </div>
          ))}
          {actions.length > 0 && (
            <div role="group" aria-label="View" className={menuStyles.settings_actions}>
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  data-testid={`settings-action-${action.id}`}
                  className={menuStyles.settings_option}
                  onClick={() => {
                    setOpen(false)
                    action.onSelect()
                  }}
                >
                  <span className={menuStyles.settings_check} aria-hidden="true" />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
