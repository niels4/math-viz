import type { ReactNode } from "react"

import cardStyles from "./SectionCard.module.css"

export function SectionCard({
  icon,
  title,
  titleId,
  cardClass,
  className,
  children,
  iconTone = "default",
}: {
  icon: ReactNode
  title: string
  titleId: string
  cardClass: string
  className?: string
  children: ReactNode
  iconTone?: "default" | "warn"
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={
        className ? `${cardClass} ${cardStyles.card} ${className}` : `${cardClass} ${cardStyles.card}`
      }
    >
      <div className={cardStyles.card_head}>
        <span className={iconTone === "warn" ? cardStyles.card_icon_warn : cardStyles.card_icon}>{icon}</span>
        <h2 id={titleId}>{title}</h2>
      </div>
      {children}
    </section>
  )
}
