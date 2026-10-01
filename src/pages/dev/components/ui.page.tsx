import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"

import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"
import tealTheme from "#src/style/themes/mathviz_clean_teal.module.css"
import warmTheme from "#src/style/themes/mathviz_educational_warm.module.css"
import violetTheme from "#src/style/themes/mathviz_midnight_violet.module.css"
import sageTheme from "#src/style/themes/mathviz_sage_editorial.module.css"
import tronTheme from "#src/style/themes/mathviz_tron_cyan.module.css"

import uiStyles from "./ui.page.module.css"

const THEMES = [
  { slug: "arctic-ice", label: "Arctic Ice", styles: arcticTheme },
  { slug: "tron-cyan", label: "Tron Cyan", styles: tronTheme },
  { slug: "midnight-violet", label: "Midnight Violet", styles: violetTheme },
  { slug: "clean-teal", label: "Clean Teal", styles: tealTheme },
  { slug: "educational-warm", label: "Educational Warm", styles: warmTheme },
  { slug: "sage-editorial", label: "Sage Editorial", styles: sageTheme },
] as const

type ThemeSlug = (typeof THEMES)[number]["slug"]
type ThemeStyles = (typeof THEMES)[number]["styles"]

const FRAMEWORKS = ["React 18", "Vue 3", "Svelte 5", "Angular 17"] as const
const TABS = ["Alerts", "Notifications", "Logs", "Activity"] as const
const TABLE_ROWS = [
  { name: "UserCard.tsx", status: "Active", updated: "2m ago" },
  { name: "Button.tsx", status: "Deprecated", updated: "1h ago" },
  { name: "Modal.tsx", status: "Beta", updated: "3h ago" },
] as const

type Framework = (typeof FRAMEWORKS)[number]
type Tab = (typeof TABS)[number]
type Density = "Comfortable" | "Compact"

const STATUS_BADGE: Record<string, (styles: ThemeStyles) => string> = {
  Active: (styles) => styles.badge_success,
  Deprecated: (styles) => styles.badge_warning,
  Beta: (styles) => styles.badge_accent,
}

function statusBadge(status: string, styles: ThemeStyles): string {
  return STATUS_BADGE[status]?.(styles) ?? styles.badge_accent
}

function SnowflakeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17" />
      <path d="M12 2l-2 2.5M12 2l2 2.5M12 22l-2-2.5M12 22l2-2.5" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" />
      <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </svg>
  )
}

function TableIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M3 14.5h18M12 9.5v10.5" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </svg>
  )
}

function ButtonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10 9.5v5M10 9.5L7.5 12 10 14.5" />
    </svg>
  )
}

function OpacitySlider({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)

  const setFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (track === null) return
    const rect = track.getBoundingClientRect()
    if (rect.width === 0) return
    const ratio = (clientX - rect.left) / rect.width
    onChange(Math.round(Math.min(100, Math.max(0, ratio * 100))))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    setFromClientX(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    setFromClientX(event.clientX)
  }

  const stopDragging = () => {
    draggingRef.current = false
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault()
      onChange(Math.min(100, value + (event.shiftKey ? 10 : 1)))
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault()
      onChange(Math.max(0, value - (event.shiftKey ? 10 : 1)))
    } else if (event.key === "Home") {
      event.preventDefault()
      onChange(0)
    } else if (event.key === "End") {
      event.preventDefault()
      onChange(100)
    }
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Opacity"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value} percent`}
      data-testid="control-opacity"
      className={uiStyles.slider_track}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onKeyDown={handleKeyDown}
    >
      <div className={uiStyles.slider_fill} style={{ width: `${value}%` }} />
      <div className={uiStyles.slider_knob} style={{ left: `${value}%` }} />
    </div>
  )
}

function ThemeSwitch({
  checked,
  onChange,
  label,
  testId,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  testId: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      data-on={checked ? "true" : "false"}
      className={uiStyles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={uiStyles.switch_track} aria-hidden="true">
        <span className={uiStyles.switch_knob} />
        <span className={uiStyles.switch_state}>{checked ? "ON" : "OFF"}</span>
      </span>
    </button>
  )
}

export default function UiPage() {
  const [query, setQuery] = useState("")
  const [themeSlug, setThemeSlug] = useState<ThemeSlug>("arctic-ice")
  const [darkMode, setDarkMode] = useState(true)
  const [email, setEmail] = useState("jane.design@arctiq.io")
  const [framework, setFramework] = useState<Framework>("React 18")
  const [telemetry, setTelemetry] = useState(true)
  const [density, setDensity] = useState<Density>("Comfortable")
  const [opacity, setOpacity] = useState(72)
  const [tab, setTab] = useState<Tab>("Alerts")
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set())
  const [page, setPage] = useState(1)

  const activeTheme = THEMES.find((theme) => theme.slug === themeSlug)?.styles ?? arcticTheme
  const activeThemeLabel = THEMES.find((theme) => theme.slug === themeSlug)?.label ?? "Arctic Ice"

  const dismissAlert = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  const visibleAlerts = [
    {
      id: "info",
      kind: uiStyles.alert_info,
      title: "Info: New version 1.4.0 is available. Review the migration guide.",
    },
    {
      id: "success",
      kind: uiStyles.alert_success,
      title: "Success: Theme saved to preferences.",
    },
    {
      id: "warning",
      kind: uiStyles.alert_warning,
      title: 'Warning: "deprecated" prop will be removed in v2.0.',
    },
  ].filter((alert) => !dismissed.has(alert.id))

  return (
    <div className={activeTheme.theme}>
      <div className={uiStyles.page} data-testid="ui-page">
        <div className={uiStyles.shell}>
          <header className={uiStyles.topbar}>
            <a className={uiStyles.wordmark} href="#dev/components/ui">
              <span className={uiStyles.wordmark_icon}>
                <SnowflakeIcon />
              </span>
              Arctiq UI
            </a>
            <div className={uiStyles.search_wrap}>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                data-testid="ui-search"
                placeholder="Search components, docs, examples…"
                aria-label="Search components, docs, examples"
                className={uiStyles.search}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
            </div>
            <div className={uiStyles.top_actions}>
              <button
                type="button"
                aria-label="Color scheme"
                aria-pressed={darkMode}
                data-testid="ui-scheme-toggle"
                className={uiStyles.scheme_toggle}
                onClick={() => setDarkMode((on) => !on)}
              >
                <span data-active={darkMode ? "false" : "true"} aria-hidden="true">
                  ☀
                </span>
                <span data-active={darkMode ? "true" : "false"} aria-hidden="true">
                  ☾
                </span>
              </button>
              <span className={uiStyles.avatar} aria-label="Signed in as Jane Doe">
                JD
              </span>
            </div>
          </header>

          <main className={uiStyles.main}>
            <div className={uiStyles.title_block}>
              <div className={uiStyles.title_row}>
                <h1>Component Library</h1>
                <span className={uiStyles.version_pill}>
                  <span className={uiStyles.version_dot} aria-hidden="true" />
                  v1.4.0
                </span>
              </div>
              <p className={uiStyles.subtitle}>
                A fully accessible, {activeThemeLabel.toLowerCase()} design system. Built for production,
                documented and ready to use.
              </p>
            </div>

            <div className={uiStyles.grid}>
              <section
                aria-labelledby="ui-theme"
                className={`${activeTheme.card} ${uiStyles.card} ${uiStyles.theme_section}`}
              >
                <div className={uiStyles.card_head}>
                  <span className={uiStyles.card_icon}>
                    <SlidersIcon />
                  </span>
                  <h2 id="ui-theme">Theme</h2>
                </div>
                <div
                  className={uiStyles.theme_group}
                  role="group"
                  aria-label="Theme"
                  data-testid="theme-switcher"
                >
                  {THEMES.map((theme) => (
                    <button
                      key={theme.slug}
                      type="button"
                      aria-pressed={theme.slug === themeSlug}
                      data-testid={`theme-${theme.slug}`}
                      className={
                        theme.slug === themeSlug
                          ? `${activeTheme.btn_primary} ${uiStyles.theme_btn}`
                          : `${activeTheme.btn_secondary} ${uiStyles.theme_btn}`
                      }
                      onClick={() => setThemeSlug(theme.slug)}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </section>
              <section aria-labelledby="ui-buttons" className={`${activeTheme.card} ${uiStyles.card}`}>
                <div className={uiStyles.card_head}>
                  <span className={uiStyles.card_icon}>
                    <ButtonIcon />
                  </span>
                  <h2 id="ui-buttons">Buttons</h2>
                </div>
                <div className={uiStyles.button_stack}>
                  <button
                    type="button"
                    data-testid="control-button-primary"
                    className={activeTheme.btn_primary}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    data-testid="control-button-secondary"
                    className={activeTheme.btn_secondary}
                  >
                    Secondary
                  </button>
                  <button type="button" data-testid="control-button-ghost" className={uiStyles.btn_ghost}>
                    Ghost Outline
                  </button>
                  <button
                    type="button"
                    data-testid="control-button-destructive"
                    className={uiStyles.btn_destructive}
                  >
                    Destructive
                  </button>
                  <button
                    type="button"
                    disabled
                    className={`${activeTheme.btn_secondary} ${uiStyles.btn_disabled}`}
                  >
                    Disabled
                  </button>
                </div>
              </section>

              <section aria-labelledby="ui-badges" className={`${activeTheme.card} ${uiStyles.card}`}>
                <div className={uiStyles.card_head}>
                  <span className={uiStyles.card_icon}>
                    <TagIcon />
                  </span>
                  <h2 id="ui-badges">Badges</h2>
                </div>
                <div className={uiStyles.badge_grid}>
                  <span className={`${activeTheme.badge_accent} ${uiStyles.badge}`}>Ice • Accent</span>
                  <span className={`${activeTheme.badge_success} ${uiStyles.badge}`}>Success ✓</span>
                  <span className={`${activeTheme.badge_warning} ${uiStyles.badge}`}>Warning !</span>
                  <span className={`${activeTheme.badge_destructive} ${uiStyles.badge}`}>Destructive ✕</span>
                </div>
              </section>

              <section aria-labelledby="ui-form" className={`${activeTheme.card} ${uiStyles.card}`}>
                <div className={uiStyles.card_head}>
                  <span className={uiStyles.card_icon}>
                    <SlidersIcon />
                  </span>
                  <h2 id="ui-form">Form controls</h2>
                </div>
                <div className={uiStyles.form_stack}>
                  <div className={uiStyles.field_row}>
                    <label className={uiStyles.label} htmlFor="ui-email">
                      Email address
                    </label>
                    <input
                      id="ui-email"
                      type="email"
                      autoComplete="email"
                      data-testid="control-email"
                      value={email}
                      onChange={(event) => setEmail(event.currentTarget.value)}
                      className={`${activeTheme.input} ${uiStyles.field}`}
                    />
                  </div>
                  <div className={uiStyles.field_row}>
                    <label className={uiStyles.label} htmlFor="ui-framework">
                      Framework
                    </label>
                    <div className={uiStyles.select_wrap}>
                      <select
                        id="ui-framework"
                        data-testid="control-framework"
                        value={framework}
                        onChange={(event) => setFramework(event.currentTarget.value as Framework)}
                        className={`${activeTheme.input} ${uiStyles.field} ${uiStyles.select}`}
                      >
                        {FRAMEWORKS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <span className={uiStyles.select_chevron} aria-hidden="true">
                        ⌄
                      </span>
                    </div>
                  </div>
                  <label className={uiStyles.check_label}>
                    <input
                      type="checkbox"
                      data-testid="control-telemetry"
                      checked={telemetry}
                      onChange={(event) => setTelemetry(event.currentTarget.checked)}
                      className={uiStyles.check}
                    />
                    Enable telemetry
                  </label>
                  <fieldset className={uiStyles.fieldset}>
                    <legend className={uiStyles.label}>Density</legend>
                    {(["Comfortable", "Compact"] as const).map((option) => (
                      <label key={option} className={uiStyles.check_label}>
                        <input
                          type="radio"
                          name="ui-density"
                          value={option}
                          data-testid={`control-density-${option.toLowerCase()}`}
                          checked={density === option}
                          onChange={() => setDensity(option)}
                          className={uiStyles.radio}
                        />
                        {option}
                      </label>
                    ))}
                  </fieldset>
                  <div className={uiStyles.dark_row}>
                    <span className={uiStyles.dark_label}>Dark mode</span>
                    <span className={uiStyles.dark_control}>
                      <span className={uiStyles.dark_state} data-testid="dark-mode-state">
                        {darkMode ? "ON" : "OFF"}
                      </span>
                      <ThemeSwitch
                        checked={darkMode}
                        onChange={setDarkMode}
                        label="Dark mode"
                        testId="control-dark-mode"
                      />
                    </span>
                  </div>
                </div>
              </section>

              <section aria-labelledby="ui-slider" className={`${activeTheme.card} ${uiStyles.card}`}>
                <div className={uiStyles.card_head}>
                  <span className={uiStyles.card_icon}>
                    <SlidersIcon />
                  </span>
                  <h2 id="ui-slider">Slider</h2>
                </div>
                <div className={uiStyles.slider_box}>
                  <div className={uiStyles.slider_head}>
                    <span className={uiStyles.slider_label}>Opacity</span>
                    <span className={uiStyles.slider_value} data-testid="readout-opacity">
                      {opacity}%
                    </span>
                  </div>
                  <OpacitySlider value={opacity} onChange={setOpacity} />
                  <div className={uiStyles.slider_scale} aria-hidden="true">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </section>

              <section aria-labelledby="ui-data" className={`${activeTheme.card} ${uiStyles.card}`}>
                <div className={uiStyles.card_head}>
                  <span className={uiStyles.card_icon}>
                    <TableIcon />
                  </span>
                  <h2 id="ui-data">Data</h2>
                </div>
                <div className={uiStyles.table_wrap}>
                  <table className={uiStyles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Status</th>
                        <th scope="col">Updated</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TABLE_ROWS.map((row) => (
                        <tr key={row.name}>
                          <td className={uiStyles.cell_name}>{row.name}</td>
                          <td>
                            <span className={`${statusBadge(row.status, activeTheme)} ${uiStyles.pill}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className={uiStyles.cell_muted}>{row.updated}</td>
                          <td>
                            <button type="button" className={uiStyles.view_link}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={uiStyles.table_foot}>
                  <span className={uiStyles.table_count}>Showing 1–3 of 24 results</span>
                  <div className={uiStyles.pagination} role="navigation" aria-label="Pagination">
                    <button type="button" className={uiStyles.page_btn}>
                      ← Previous
                    </button>
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-current={n === page ? "page" : undefined}
                        data-testid={`page-${n}`}
                        className={
                          n === page ? `${uiStyles.page_btn} ${uiStyles.page_btn_active}` : uiStyles.page_btn
                        }
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button type="button" className={uiStyles.page_btn}>
                      Next →
                    </button>
                  </div>
                </div>
              </section>

              <section aria-labelledby="ui-feedback" className={`${activeTheme.card} ${uiStyles.card}`}>
                <div className={uiStyles.card_head}>
                  <span className={uiStyles.card_icon}>
                    <BellIcon />
                  </span>
                  <h2 id="ui-feedback">Feedback</h2>
                </div>
                <div className={uiStyles.tabs} role="tablist" aria-label="Feedback categories">
                  {TABS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={tab === name}
                      data-testid={`tab-${name.toLowerCase()}`}
                      className={tab === name ? `${uiStyles.tab} ${uiStyles.tab_active}` : uiStyles.tab}
                      onClick={() => setTab(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {tab === "Alerts" ? (
                  <div className={uiStyles.alert_stack}>
                    {visibleAlerts.length === 0 ? (
                      <p className={uiStyles.alert_empty}>You&apos;re all caught up.</p>
                    ) : (
                      visibleAlerts.map((alert) => (
                        <div key={alert.id} className={`${uiStyles.alert} ${alert.kind}`} role="alert">
                          <span className={uiStyles.alert_text}>{alert.title}</span>
                          <button
                            type="button"
                            aria-label={`Dismiss ${alert.id} notification`}
                            data-testid={`dismiss-${alert.id}`}
                            className={uiStyles.alert_close}
                            onClick={() => dismissAlert(alert.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className={uiStyles.tab_empty}>
                    No {tab.toLowerCase()} yet — switch back to Alerts to review notifications.
                  </p>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
