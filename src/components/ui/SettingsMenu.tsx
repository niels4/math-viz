import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"

import { usePresence } from "#src/components/hooks/usePresence.ts"
import {
  DARK_THEME_SLUGS,
  LIGHT_THEME_SLUGS,
  appThemes,
  useAppTheme,
  type ColorMode,
  type ColorScheme,
} from "#src/state/useAppTheme.ts"
import { motionCssVars, overlayLeaveMs } from "#src/util/motion/motion.ts"

import { CheckIcon, GearIcon, MoonIcon, SunIcon, SystemIcon } from "./icons.tsx"
import { keyTarget } from "./radioKeys.ts"
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl.tsx"
import menuStyles from "./SettingsMenu.module.css"

/** D9: the user's order, each an icon and a word. */
const MODE_OPTIONS: readonly SegmentedOption<ColorMode>[] = [
  {
    value: "system",
    label: (
      <>
        <SystemIcon />
        System
      </>
    ),
  },
  {
    value: "light",
    label: (
      <>
        <SunIcon />
        Light
      </>
    ),
  },
  {
    value: "dark",
    label: (
      <>
        <MoonIcon />
        Dark
      </>
    ),
  },
]

const THEMES = { dark: DARK_THEME_SLUGS, light: LIGHT_THEME_SLUGS } as const

/** The theme list's three rows: places, which keep while their themes change with the scheme (D7). */
const ROWS = [0, 1, 2] as const

/** D8: one line in every mode; in System it says which scheme the system gives. */
const helpFor = (mode: ColorMode, scheme: ColorScheme): string =>
  mode === "system"
    ? `Your system is ${scheme} right now.`
    : mode === "light"
      ? "Always light."
      : "Always dark."

/** A row of the theme list: the one showing `slug`, or the checked one. */
const rowOf = (list: HTMLElement | null, slug: string | null): HTMLElement | null =>
  list?.querySelector<HTMLElement>(slug === null ? '[aria-checked="true"]' : `[data-theme="${slug}"]`) ?? null

/** A theme in little, in its own colours: its page, its curve and P. */
function SwatchCurve() {
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true">
      <path className={menuStyles.settings_swatch_curve} d="M6 4.63Q15 25.37 24 4.63" />
      <circle className={menuStyles.settings_swatch_point} cx="21" cy="10.39" r="2.25" />
    </svg>
  )
}

// The top bar's gear and its settings (figma0 310 Settings menu): a
// non-modal dialog holding two radio groups (D1), Appearance (System,
// Light, Dark) with a line naming the scheme in use, and the three themes
// of that scheme. A pick applies at once and the panel stays open (D2).
// Opening puts the focus on the checked theme (D3); Esc or Enter in the
// panel closes it and hands the focus back to the gear, as Esc on the gear
// does before the view's own Esc; a press outside, or the focus leaving
// (Tab past the list), closes it too. Three tab stops: the gear, the
// toggle, the list; arrows pick within a group, wrapping. When the scheme
// changes while it is open, the list keeps its rows and their new content
// fades in (D7). The panel comes out of the gear on the enter spring at the
// spring's own pace and goes back in 200 ms, 120 ms fades under reduced
// motion (SettingsMenu.module.css; the motion tokens ride along on the
// wrapper, as on any page); while it leaves it takes no input.
export function SettingsMenu() {
  const { prefs, scheme, setMode, setTheme } = useAppTheme()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const presence = usePresence(open, overlayLeaveMs())
  const panelId = useId()
  const helpId = useId()
  const themeLabelId = useId()

  // What comes in with a new scheme while the panel is open fades in
  // (D7); what the panel opens on shows with the panel.
  const [shownScheme, setShownScheme] = useState(scheme)
  const [swapped, setSwapped] = useState(false)
  if (scheme !== shownScheme) {
    setShownScheme(scheme)
    setSwapped(open)
  }

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) {
      buttonRef.current?.focus()
    }
  }

  const themes = THEMES[scheme]
  const checkedSlug = prefs[scheme]

  // D3: opening puts the focus on the checked theme.
  useEffect(() => {
    if (open) {
      rowOf(listRef.current, null)?.focus()
    }
  }, [open])

  // D7: while the focus is in the list it sits on the checked theme, also
  // when the scheme changes under it (the rows stay, so it is still there).
  useLayoutEffect(() => {
    const list = listRef.current
    if (list?.contains(document.activeElement) === true) {
      rowOf(list, checkedSlug)?.focus()
    }
  }, [checkedSlug])

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

  /** ↑ ↓ ← → pick the previous or next theme, wrapping; Home and End the ends. */
  const moveInList = (event: KeyboardEvent<HTMLElement>) => {
    const from = Math.max(
      ROWS.findIndex((row) => themes[row] === checkedSlug),
      0,
    )
    const to = keyTarget(event.key, from, ROWS.length - 1)
    if (to === undefined) {
      return
    }
    event.preventDefault()
    const row = ROWS[(to + ROWS.length) % ROWS.length]
    if (row !== undefined) {
      setTheme(themes[row])
    }
  }

  return (
    <div
      ref={wrapRef}
      className={menuStyles.settings_wrap}
      style={motionCssVars}
      onBlur={(event) => {
        // The focus went somewhere outside (Tab past the list, Shift+Tab
        // past the gear); none at all (the window's, a press outside) leaves
        // the panel to the press.
        const to = event.relatedTarget
        if (open && to !== null && !event.currentTarget.contains(to)) {
          setOpen(false)
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        data-testid="settings-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Settings"
        className={menuStyles.settings_button}
        onClick={() => {
          if (open) {
            // From the gear, again: closed, the focus on the gear (WebKit
            // leaves a pressed button unfocused).
            close(false)
            buttonRef.current?.focus({ focusVisible: false })
          } else {
            setSwapped(false)
            setOpen(true)
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            // The view's own Esc (an explainer, the tour) waits for the next one.
            event.preventDefault()
            close(false)
          }
        }}
      >
        <GearIcon />
      </button>
      {presence !== "closed" ? (
        // The dialog takes Esc and Enter for the controls inside it.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          id={panelId}
          role="dialog"
          aria-label="Settings"
          data-testid="settings-panel"
          data-closing={presence === "closing" || undefined}
          inert={presence === "closing"}
          className={menuStyles.settings_panel}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter") {
              event.preventDefault()
              close(true)
            }
          }}
        >
          <section className={menuStyles.settings_section}>
            <p className={menuStyles.settings_label}>Appearance</p>
            <SegmentedControl
              label="Appearance"
              describedBy={helpId}
              testId="settings-mode"
              className={menuStyles.settings_mode}
              options={MODE_OPTIONS}
              value={prefs.mode}
              onChange={setMode}
            />
            <p id={helpId} className={menuStyles.settings_help} data-testid="settings-help">
              <span key={scheme} className={menuStyles.settings_swap} data-swapped={swapped || undefined}>
                {helpFor(prefs.mode, scheme)}
              </span>
            </p>
          </section>
          <section className={menuStyles.settings_section}>
            <p id={themeLabelId} className={menuStyles.settings_label}>
              <span key={scheme} className={menuStyles.settings_swap} data-swapped={swapped || undefined}>
                {scheme === "dark" ? "Dark theme" : "Light theme"}
              </span>
            </p>
            <div
              ref={listRef}
              role="radiogroup"
              aria-labelledby={themeLabelId}
              data-testid="settings-themes"
              className={menuStyles.settings_list}
            >
              {ROWS.map((row) => {
                const slug = themes[row]
                const checked = slug === checkedSlug
                return (
                  <button
                    key={row}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    tabIndex={checked ? 0 : -1}
                    data-theme={slug}
                    data-testid={`settings-theme-${slug}`}
                    className={menuStyles.settings_row}
                    onClick={(event) => {
                      // Focused as the toggle's options are, so the arrows go on from here.
                      event.currentTarget.focus({ focusVisible: false })
                      setTheme(slug)
                    }}
                    onKeyDown={moveInList}
                  >
                    <span
                      key={scheme}
                      className={`${menuStyles.settings_row_content} ${menuStyles.settings_swap}`}
                      data-swapped={swapped || undefined}
                    >
                      <span className={menuStyles.settings_swatch} aria-hidden="true">
                        <span className={`${appThemes[slug].className} ${menuStyles.settings_swatch_theme}`}>
                          <SwatchCurve />
                        </span>
                      </span>
                      <span className={menuStyles.settings_name}>{appThemes[slug].label}</span>
                      <span className={menuStyles.settings_check} aria-hidden="true">
                        {checked && <CheckIcon />}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
