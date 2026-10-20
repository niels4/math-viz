import { useId } from "react"

import sidebarStyle from "../SideBar.module.css"
import style from "./PointsSection.module.css"
import { PRow } from "./PRow"
import { QRow } from "./QRow"

export const PointsSection = () => {
  const titleId = useId()

  return (
    <section className={sidebarStyle.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={sidebarStyle.card_title}>
        Points
      </h2>
      <div className={style.points}>
        <PRow />
        <QRow />
      </div>
    </section>
  )
}
