import { useId, type ReactNode } from "react"

import style from "./PanelSection.module.css"

// One numbered section of the panel (fvStep): a step badge and the caps
// title as the heading that names it, an optional action at the header's
// far end (section 2's Reset all), then the section's parts, 10 px apart.
// A quiet section keeps its heading for screen readers only (the dock's
// points, R9).
export function PanelSection({
  step,
  title,
  action,
  quiet = false,
  className,
  children,
}: {
  step: number
  title: string
  action?: ReactNode
  quiet?: boolean
  className?: string | undefined
  children: ReactNode
}) {
  const id = useId()
  return (
    <section
      className={className === undefined ? style.section : `${style.section} ${className}`}
      aria-labelledby={id}
    >
      <div className={quiet ? style.quiet : style.header_row}>
        <h2 id={id} className={style.header}>
          <span className={style.step}>{step}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
