import tabsStyles from "./Tabs.module.css"

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<T>
  active: T
  onChange: (next: T) => void
}) {
  return (
    <div className={tabsStyles.tabs} role="tablist" aria-label="Feedback categories">
      {tabs.map((name) => (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={active === name}
          data-testid={`tab-${name.toLowerCase()}`}
          className={active === name ? `${tabsStyles.tab} ${tabsStyles.tab_active}` : tabsStyles.tab}
          onClick={() => onChange(name)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
