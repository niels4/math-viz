import { useState } from "react"

import { AlertStack, type AlertItem } from "#src/components/ui/AlertStack.tsx"
import { Badge, type BadgeVariant } from "#src/components/ui/Badge.tsx"
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
import { useAppTheme } from "#src/state/useAppTheme.ts"

import uiStyles from "./ui.page.module.css"

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

const STATUS_BADGE: Record<string, BadgeVariant> = {
  Active: "success",
  Deprecated: "warning",
  Beta: "accent",
}

function statusBadge(status: string): BadgeVariant {
  return STATUS_BADGE[status] ?? "accent"
}

export default function UiPage() {
  const [query, setQuery] = useState("")
  const { themeClass, themeLabel } = useAppTheme()
  const [darkMode, setDarkMode] = useState(true)
  const [email, setEmail] = useState("jane.design@arctiq.io")
  const [framework, setFramework] = useState<Framework>("React 18")
  const [telemetry, setTelemetry] = useState(true)
  const [density, setDensity] = useState<Density>("Comfortable")
  const [opacity, setOpacity] = useState(72)
  const [tab, setTab] = useState<Tab>("Alerts")
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set())
  const [page, setPage] = useState(1)

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
    <div className={themeClass}>
      <div className={uiStyles.page} data-testid="ui-page">
        <div className={uiStyles.shell}>
          <TopBar query={query} onQueryChange={setQuery} actions={<SettingsMenu />} />

          <main className={uiStyles.main}>
            <TitleBlock
              title="Component Library"
              version="v1.4.0"
              subtitle={
                <>
                  A fully accessible, {themeLabel.toLowerCase()} design system. Built for production,
                  documented and ready to use.
                </>
              }
            />

            <div className={uiStyles.grid}>
              <SectionCard
                icon={<SlidersIcon />}
                title="Theme"
                titleId="ui-theme"
                className={uiStyles.theme_section}
              >
                <ThemeSwitcher />
              </SectionCard>
              <SectionCard icon={<ButtonIcon />} title="Buttons" titleId="ui-buttons">
                <div className={uiStyles.button_stack}>
                  <Button variant="primary" testId="control-button-primary">
                    Primary
                  </Button>
                  <Button variant="secondary" testId="control-button-secondary">
                    Secondary
                  </Button>
                  <Button variant="ghost" testId="control-button-ghost">
                    Ghost Outline
                  </Button>
                  <Button variant="destructive" testId="control-button-destructive">
                    Destructive
                  </Button>
                  <Button variant="disabled">Disabled</Button>
                </div>
              </SectionCard>

              <SectionCard icon={<TagIcon />} title="Badges" titleId="ui-badges">
                <div className={uiStyles.badge_grid}>
                  <Badge tone="accent">Ice • Accent</Badge>
                  <Badge tone="success">Success ✓</Badge>
                  <Badge tone="warning">Warning !</Badge>
                  <Badge tone="destructive">Destructive ✕</Badge>
                </div>
              </SectionCard>

              <SectionCard icon={<SlidersIcon />} title="Form controls" titleId="ui-form">
                <div className={uiStyles.form_stack}>
                  <Field label="Email address" htmlFor="ui-email">
                    <TextField
                      id="ui-email"
                      type="email"
                      autoComplete="email"
                      testId="control-email"
                      value={email}
                      onChange={setEmail}
                    />
                  </Field>
                  <Field label="Framework" htmlFor="ui-framework">
                    <Select
                      id="ui-framework"
                      testId="control-framework"
                      value={framework}
                      onChange={(next) => setFramework(next as Framework)}
                      options={FRAMEWORKS}
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

              <SectionCard icon={<SlidersIcon />} title="Slider" titleId="ui-slider">
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

              <SectionCard icon={<TableIcon />} title="Data" titleId="ui-data">
                <DataTable rows={TABLE_ROWS} statusTone={statusBadge} />
                <Pagination
                  page={page}
                  pageCount={3}
                  onChange={setPage}
                  countLabel="Showing 1–3 of 24 results"
                />
              </SectionCard>

              <SectionCard icon={<BellIcon />} title="Feedback" titleId="ui-feedback">
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
