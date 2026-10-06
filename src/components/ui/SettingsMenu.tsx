import { useEffect, useRef, useState } from "react"

import { usePresence } from "#src/components/hooks/usePresence.ts"
import { DARK_THEME_SLUGS, LIGHT_THEME_SLUGS, appThemes } from "#src/state/useAppTheme.ts"
import { MENU_LEAVE_MS, REDUCED_FADE_MS, motionCssVars, motionLevel } from "#src/util/motion/motion.ts"

import { useAppTheme } from "../../state/useAppTheme.ts"
import { CheckIcon, GearIcon } from "./icons.tsx"
import menuStyles from "./SettingsMenu.module.css"

/** A view's own item in the settings menu, under the themes: "Show the tour again". */
export type SettingsAction = { id: string; label: string; onSelect: () => void }

/** Where the focus goes as the menu opens: the checked theme, or the last item (↑ on the gear). */
type OpenAt = "checked" | "last"

const itemsOf = (menu: HTMLElement | null): HTMLElement[] => [
  ...(menu?.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitem"]') ?? []),
]

/** How long the menu stays on its way out: as long as its CSS takes to leave. */
const leaveMs = (): number => {
  const level = motionLevel()
  return level === "none" ? 0 : level === "reduced" ? REDUCED_FADE_MS : MENU_LEAVE_MS
}

// The top bar's gear and its menu: the themes, dark then light, and a
// view's own items under them. The menu comes out of the gear on the enter
// spring at the spring's own pace and goes back in 200 ms, 120 ms fades
// under reduced motion (SettingsMenu.module.css; the motion tokens ride
// along on the wrapper, as on any page); while it leaves it takes no input. It
// is a menu button (WAI-ARIA APG): opening moves the focus to the checked
// theme (↑ on the gear: the last item), ↑ ↓ Home End move it, Enter or a
// click picks, Esc closes from the gear or the menu and hands the focus
// back to the gear, Tab closes it on the way out.
export function SettingsMenu({ actions = [] }: { actions?: readonly SettingsAction[] }) {
  const { themeSlug, setThemeSlug } = useAppTheme()
  const [open, setOpen] = useState<OpenAt | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const presence = usePresence(open !== null, leaveMs())

  const close = (refocus: boolean) => {
    setOpen(null)
    if (refocus) {
      buttonRef.current?.focus()
    }
  }

  useEffect(() => {
    if (open === null) {
      return
    }
    const list = itemsOf(menuRef.current)
    const target = open === "last" ? list.at(-1) : list.find((el) => el.ariaChecked === "true")
    ;(target ?? list[0])?.focus()
  }, [open])

  const isOpen = open !== null
  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (wrapRef.current !== null && !wrapRef.current.contains(event.target as Node)) {
        setOpen(null)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isOpen])

  /** ↑ ↓ wrap around the items; Home and End go to the ends. */
  const moveFocus = (key: string): boolean => {
    const list = itemsOf(menuRef.current)
    const at = list.indexOf(document.activeElement as HTMLElement)
    const n = list.length
    const to =
      key === "ArrowDown"
        ? (at + 1) % n
        : key === "ArrowUp"
          ? (at - 1 + n) % n
          : key === "Home"
            ? 0
            : key === "End"
              ? n - 1
              : null
    if (to === null || n === 0) {
      return false
    }
    list[to]?.focus()
    return true
  }

  const groups = [
    { id: "dark", label: "Dark", slugs: DARK_THEME_SLUGS },
    { id: "light", label: "Light", slugs: LIGHT_THEME_SLUGS },
  ] as const

  return (
    <div ref={wrapRef} className={menuStyles.settings_wrap} style={motionCssVars}>
      <button
        ref={buttonRef}
        type="button"
        data-testid="settings-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="settings-theme-menu"
        aria-label="Settings"
        className={menuStyles.settings_button}
        onClick={() => setOpen((prev) => (prev === null ? "checked" : null))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            setOpen(event.key === "ArrowUp" ? "last" : "checked")
          } else if (event.key === "Escape" && isOpen) {
            // The view's own Esc (an explainer, the tour) waits for the next one.
            event.preventDefault()
            close(true)
          }
        }}
      >
        <GearIcon />
      </button>
      {presence !== "closed" ? (
        <div
          ref={menuRef}
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
              close(true)
            } else if (event.key === "Tab") {
              setOpen(null)
            } else if (moveFocus(event.key)) {
              event.preventDefault()
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
                    tabIndex={-1}
                    aria-checked={selected}
                    data-testid={`settings-theme-${slug}`}
                    className={
                      selected
                        ? `${menuStyles.settings_option} ${menuStyles.settings_option_active}`
                        : menuStyles.settings_option
                    }
                    onClick={() => {
                      setThemeSlug(slug)
                      close(true)
                    }}
                  >
                    <span className={menuStyles.settings_check} aria-hidden="true">
                      {selected && <CheckIcon />}
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
                  tabIndex={-1}
                  data-testid={`settings-action-${action.id}`}
                  className={menuStyles.settings_option}
                  onClick={() => {
                    close(true)
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
