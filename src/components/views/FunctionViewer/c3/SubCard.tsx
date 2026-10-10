import { useId, type ReactNode } from "react"

import style from "./SubCard.module.css"

// One section of the C3 sidebar on its own surface (figma0 SB2 · B2 › Sub
// card, which SB3 · C3 keeps): its title as the heading that names it, an
// optional action at the head's far end (Transform's Reset all), then the
// section's parts. The action comes last in the DOM, so Tab reaches it
// after the section's own controls (FV 07); the layout sets it in the head.
export function SubCard({
  title,
  action,
  testId,
  children,
}: {
  title: string
  action?: ReactNode
  testId?: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <section
      className={style.card}
      aria-labelledby={id}
      data-action={action == null ? undefined : true}
      data-testid={testId}
    >
      <div className={style.head}>
        <h2 id={id} className={style.title}>
          {title}
        </h2>
      </div>
      {children}
      {action != null && <div className={style.action}>{action}</div>}
    </section>
  )
}
