import type { ReactNode } from "react"

import { SearchIcon, SnowflakeIcon } from "./icons.tsx"
import topbarStyles from "./TopBar.module.css"

// Two headers. Without a title, the ui page's: the wordmark, an optional
// search and the actions. With one, a view's header (figma0's top-bar-v2):
// a card holding the wordmark, the view's title and caps subtitle, and the
// actions at the far end, where views put the theme chip and settings.
export function TopBar({
  query,
  onQueryChange,
  actions,
  wordmarkHref = "#",
  title,
  subtitle,
  className,
}: {
  query?: string
  onQueryChange?: (next: string) => void
  actions: ReactNode
  wordmarkHref?: string
  title?: string
  subtitle?: string
  className?: string
}) {
  const showSearch = query !== undefined && onQueryChange !== undefined
  const view = title !== undefined
  const classes = [topbarStyles.topbar, view ? topbarStyles.topbar_view : null, className]
  return (
    <header className={classes.filter(Boolean).join(" ")}>
      <a className={topbarStyles.wordmark} href={wordmarkHref} aria-label="MathViz">
        <span className={topbarStyles.wordmark_icon}>
          <SnowflakeIcon />
        </span>
        <span className={topbarStyles.wordmark_text}>MathViz</span>
      </a>
      {view ? (
        <>
          <span className={topbarStyles.separator} aria-hidden="true" />
          <div className={topbarStyles.title_block}>
            {/* One line each: the inner span keeps nowrap, which global.css's
            unlayered text-wrap on h1 and p would otherwise override. */}
            <h1 className={topbarStyles.title}>
              <span className={topbarStyles.one_line}>{title}</span>
            </h1>
            {subtitle === undefined ? null : (
              <p className={topbarStyles.subtitle}>
                <span className={topbarStyles.one_line}>{subtitle}</span>
              </p>
            )}
          </div>
        </>
      ) : null}
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
