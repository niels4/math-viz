import { useId } from "react"

import sidebarStyle from "../SideBar.module.css"
import { PointSlider } from "./PointSlider"

export const PointsSection = () => {
  const titleId = useId()

  return (
    <section className={sidebarStyle.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={sidebarStyle.card_title}>
        Points
      </h2>
      <PointSlider />
    </section>
  )
}
