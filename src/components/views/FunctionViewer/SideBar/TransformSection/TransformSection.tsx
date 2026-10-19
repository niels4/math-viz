import { useId } from "react"

import sidebarStyle from "../SideBar.module.css"
import { TransformRow } from "./TransformRow.tsx"
import style from "./TransformSection.module.css"

export const TransformSection = () => {
  const titleId = useId()

  return (
    <section className={sidebarStyle.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={sidebarStyle.card_title}>
        Transform
      </h2>
      {/* The parameters outside f( ), which move the curve vertically, then
          the ones inside, which move it horizontally. */}
      <TransformRow name="y scale" param="a" />
      <TransformRow name="y shift" param="k" />
      <div className={style.rule} aria-hidden="true" />
      <TransformRow name="x scale" param="b" />
      <TransformRow name="x shift" param="h" />
    </section>
  )
}
