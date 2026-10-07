import { useId, type ReactNode } from "react"

import style from "./PanelSection.module.css"

// One numbered section of the panel (fvStep): a step badge and the caps
// title as the heading that names it, an optional action at the header's
// far end (section 2's Reset all), then the section's parts, 10 px apart.
// The action comes last in the DOM, so Tab reaches it after the section's
// own controls (FV 07: Reset all is stop 6, after the four rulers); the
// layout sets it in the header's row.
export function PanelSection({
  step,
  title,
  action,
  children,
}: {
  step: number
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  const id = useId()
  return (
    <section className={style.section} aria-labelledby={id} data-action={action == null ? undefined : true}>
      <div className={style.header_row}>
        <h2 id={id} className={style.header}>
          <span className={style.step}>{step}</span>
          {title}
        </h2>
      </div>
      {children}
      {action != null && <div className={style.action}>{action}</div>}
    </section>
  )
}
