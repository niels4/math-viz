import { useId } from "react"

import sidebarStyle from "./SideBar.module.css"

export const TransformSection = () => {
  const titleId = useId()

  return (
    <section className={sidebarStyle.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={sidebarStyle.card_title}>
        Transform
      </h2>
    </section>
  )
}
