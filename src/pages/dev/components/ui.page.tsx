import { useAtom } from "jotai"
import { useState } from "react"

import { AlertStack, type AlertItem } from "#src/components/ui/AlertStack.tsx"
import { Badge } from "#src/components/ui/Badge.tsx"
import { Button } from "#src/components/ui/Button.tsx"
import { Checkbox } from "#src/components/ui/Checkbox.tsx"
import { DataTable } from "#src/components/ui/DataTable.tsx"
import { Field } from "#src/components/ui/Field.tsx"
import { BellIcon, ButtonIcon, SlidersIcon, TableIcon, TagIcon } from "#src/components/ui/icons.tsx"
import { Pagination } from "#src/components/ui/Pagination.tsx"
import { RadioGroup } from "#src/components/ui/RadioGroup.tsx"
import { SectionCard } from "#src/components/ui/SectionCard.tsx"
import { Select } from "#src/components/ui/Select.tsx"
import { SettingsMenu } from "#src/components/ui/SettingsMenu.tsx"
import { Slider } from "#src/components/ui/Slider.tsx"
import { Switch } from "#src/components/ui/Switch.tsx"
import { Tabs } from "#src/components/ui/Tabs.tsx"
import { TextField } from "#src/components/ui/TextField.tsx"
import { ThemeSwitcher } from "#src/components/ui/ThemeSwitcher.tsx"
import { TitleBlock } from "#src/components/ui/TitleBlock.tsx"
import { TopBar } from "#src/components/ui/TopBar.tsx"
import { themeAtom, type ThemeSlug } from "#src/state/theme.ts"
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

export default function UiPage() {
  const [query, setQuery] = useState("")
  const [themeSlug, setThemeSlug] = useAtom(themeAtom)
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

  const allAlerts: ReadonlyArray<AlertItem> = [
    {
      id: "info",
      kind: "info",
      title: "Info: New version 1.4.0 is available. Review the migration guide.",
    },
    {
      id: "success",
      kind: "success",
      title: "Success: Theme saved to preferences.",
    },
    {
      id: "warning",
      kind: "warning",
      title: 'Warning: "deprecated" prop will be removed in v2.0.',
    },
  ]

  const visibleAlerts = allAlerts.filter((alert) => !dismissed.has(alert.id))

  return (
    <div className={activeTheme.theme}>
      <div className={uiStyles.page} data-testid="ui-page">
        <div className={uiStyles.shell}>
          <TopBar
            query={query}
            onQueryChange={setQuery}
            actions={<SettingsMenu themeSlug={themeSlug} onSelect={setThemeSlug} />}
          />

          <main className={uiStyles.main}>
            <TitleBlock
              title="Component Library"
              version="v1.4.0"
              subtitle={
                <>
                  A fully accessible, {activeThemeLabel.toLowerCase()} design system. Built for production,
                  documented and ready to use.
                </>
              }
            />

            <div className={uiStyles.grid}>
              <SectionCard
                icon={<SlidersIcon />}
                title="Theme"
                titleId="ui-theme"
                cardClass={activeTheme.card}
                className={uiStyles.theme_section}
              >
                <ThemeSwitcher
                  themes={THEMES}
                  activeSlug={themeSlug}
                  onSelect={(slug) => setThemeSlug(slug as ThemeSlug)}
                  primaryClass={activeTheme.btn_primary}
                  secondaryClass={activeTheme.btn_secondary}
                />
              </SectionCard>
              <SectionCard
                icon={<ButtonIcon />}
                title="Buttons"
                titleId="ui-buttons"
                cardClass={activeTheme.card}
              >
                <div className={uiStyles.button_stack}>
                  <Button
                    variant="primary"
                    testId="control-button-primary"
                    primaryClass={activeTheme.btn_primary}
                    secondaryClass={activeTheme.btn_secondary}
                  >
                    Primary
                  </Button>
                  <Button
                    variant="secondary"
                    testId="control-button-secondary"
                    primaryClass={activeTheme.btn_primary}
                    secondaryClass={activeTheme.btn_secondary}
                  >
                    Secondary
                  </Button>
                  <Button
                    variant="ghost"
                    testId="control-button-ghost"
                    primaryClass={activeTheme.btn_primary}
                    secondaryClass={activeTheme.btn_secondary}
                  >
                    Ghost Outline
                  </Button>
                  <Button
                    variant="destructive"
                    testId="control-button-destructive"
                    primaryClass={activeTheme.btn_primary}
                    secondaryClass={activeTheme.btn_secondary}
                  >
                    Destructive
                  </Button>
                  <Button
                    variant="disabled"
                    primaryClass={activeTheme.btn_primary}
                    secondaryClass={activeTheme.btn_secondary}
                  >
                    Disabled
                  </Button>
                </div>
              </SectionCard>

              <SectionCard icon={<TagIcon />} title="Badges" titleId="ui-badges" cardClass={activeTheme.card}>
                <div className={uiStyles.badge_grid}>
                  <Badge toneClass={activeTheme.badge_accent}>Ice • Accent</Badge>
                  <Badge toneClass={activeTheme.badge_success}>Success ✓</Badge>
                  <Badge toneClass={activeTheme.badge_warning}>Warning !</Badge>
                  <Badge toneClass={activeTheme.badge_destructive}>Destructive ✕</Badge>
                </div>
              </SectionCard>

              <SectionCard
                icon={<SlidersIcon />}
                title="Form controls"
                titleId="ui-form"
                cardClass={activeTheme.card}
              >
                <div className={uiStyles.form_stack}>
                  <Field label="Email address" htmlFor="ui-email">
                    <TextField
                      id="ui-email"
                      type="email"
                      autoComplete="email"
                      testId="control-email"
                      value={email}
                      onChange={setEmail}
                      inputClass={activeTheme.input}
                    />
                  </Field>
                  <Field label="Framework" htmlFor="ui-framework">
                    <Select
                      id="ui-framework"
                      testId="control-framework"
                      value={framework}
                      onChange={(next) => setFramework(next as Framework)}
                      options={FRAMEWORKS}
                      inputClass={activeTheme.input}
                    />
                  </Field>
                  <Checkbox checked={telemetry} onChange={setTelemetry} testId="control-telemetry">
                    Enable telemetry
                  </Checkbox>
                  <RadioGroup
                    legend="Density"
                    name="ui-density"
                    options={["Comfortable", "Compact"] as const}
                    value={density}
                    onChange={setDensity}
                    testIdPrefix="control-density-"
                  />
                  <div className={uiStyles.dark_row}>
                    <span className={uiStyles.dark_label}>Dark mode</span>
                    <span className={uiStyles.dark_control}>
                      <span className={uiStyles.dark_state} data-testid="dark-mode-state">
                        {darkMode ? "ON" : "OFF"}
                      </span>
                      <Switch
                        checked={darkMode}
                        onChange={setDarkMode}
                        label="Dark mode"
                        testId="control-dark-mode"
                      />
                    </span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={<SlidersIcon />}
                title="Slider"
                titleId="ui-slider"
                cardClass={activeTheme.card}
              >
                <div className={uiStyles.slider_box}>
                  <div className={uiStyles.slider_head}>
                    <span className={uiStyles.slider_label}>Opacity</span>
                    <span className={uiStyles.slider_value} data-testid="readout-opacity">
                      {opacity}%
                    </span>
                  </div>
                  <Slider value={opacity} onChange={setOpacity} label="Opacity" testId="control-opacity" />
                  <div className={uiStyles.slider_scale} aria-hidden="true">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={<TableIcon />} title="Data" titleId="ui-data" cardClass={activeTheme.card}>
                <DataTable rows={TABLE_ROWS} statusTone={(status) => statusBadge(status, activeTheme)} />
                <Pagination
                  page={page}
                  pageCount={3}
                  onChange={setPage}
                  countLabel="Showing 1–3 of 24 results"
                />
              </SectionCard>

              <SectionCard
                icon={<BellIcon />}
                title="Feedback"
                titleId="ui-feedback"
                cardClass={activeTheme.card}
              >
                <Tabs tabs={TABS} active={tab} onChange={setTab} />
                {tab === "Alerts" ? (
                  <AlertStack alerts={visibleAlerts} onDismiss={dismissAlert} />
                ) : (
                  <p className={uiStyles.tab_empty}>
                    No {tab.toLowerCase()} yet — switch back to Alerts to review notifications.
                  </p>
                )}
              </SectionCard>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
