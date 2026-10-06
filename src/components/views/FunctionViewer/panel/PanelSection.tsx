import { useId, type ReactNode } from "react"

import style from "./PanelSection.module.css"

// One numbered section of the panel (fvStep): a step badge and the caps
// title as the heading that names it, then the section's parts, 10 px apart.
export function PanelSection({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <section className={style.section} aria-labelledby={id}>
      <h2 id={id} className={style.header}>
        <span className={style.step}>{step}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}
