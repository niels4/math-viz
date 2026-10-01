import type { ReactNode } from "react"

import titleStyles from "./TitleBlock.module.css"

export function TitleBlock({
  title,
  version,
  subtitle,
}: {
  title: string
  version: string
  subtitle: ReactNode
}) {
  return (
    <div className={titleStyles.title_block}>
      <div className={titleStyles.title_row}>
        <h1>{title}</h1>
        <span className={titleStyles.version_pill}>
          <span className={titleStyles.version_dot} aria-hidden="true" />
          {version}
        </span>
      </div>
      <p className={titleStyles.subtitle}>{subtitle}</p>
    </div>
  )
}
