import type { ReactNode } from "react"

import { SearchIcon, SnowflakeIcon } from "./icons.tsx"
import topbarStyles from "./TopBar.module.css"

export function TopBar({
  query,
  onQueryChange,
  actions,
  wordmarkHref = "#",
}: {
  query?: string
  onQueryChange?: (next: string) => void
  actions: ReactNode
  wordmarkHref?: string
}) {
  const showSearch = query !== undefined && onQueryChange !== undefined
  return (
    <header className={topbarStyles.topbar}>
      <a className={topbarStyles.wordmark} href={wordmarkHref}>
        <span className={topbarStyles.wordmark_icon}>
          <SnowflakeIcon />
        </span>
        MathViz
      </a>
      {showSearch ? (
        <div className={topbarStyles.search_wrap}>
          <SearchIcon />
          <input
            type="search"
            value={query}
            data-testid="ui-search"
            placeholder="Search components, docs, examples…"
            aria-label="Search components, docs, examples"
            className={topbarStyles.search}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
          />
        </div>
      ) : null}
      <div className={topbarStyles.top_actions}>{actions}</div>
    </header>
  )
}
