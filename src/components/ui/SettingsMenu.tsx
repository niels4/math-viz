import { useEffect, useRef, useState } from "react"

import { DARK_THEME_SLUGS, LIGHT_THEME_SLUGS, appThemes } from "#src/state/useAppTheme.ts"

import { useAppTheme } from "../../state/useAppTheme.ts"
import { GearIcon } from "./icons.tsx"
import menuStyles from "./SettingsMenu.module.css"

export function SettingsMenu() {
  const { themeSlug, setThemeSlug } = useAppTheme()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

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
    <div ref={wrapRef} className={menuStyles.settings_wrap}>
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
      {open ? (
        <div
          id="settings-theme-menu"
          role="menu"
          tabIndex={-1}
          aria-label="Theme settings"
          data-testid="settings-menu"
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
        </div>
      ) : null}
    </div>
  )
}
