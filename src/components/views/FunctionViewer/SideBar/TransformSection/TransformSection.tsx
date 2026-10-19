import { useSetAtom } from "jotai"
import { useId } from "react"

import { jumpsAtom } from "../../state.ts"
import sidebarStyle from "../SideBar.module.css"
import { ResetIcon } from "./ResetIcon.tsx"
import { TransformRow } from "./TransformRow.tsx"
import style from "./TransformSection.module.css"
import { useReset } from "./useReset.ts"

export const TransformSection = () => {
  const titleId = useId()
  const resets = [useReset("a"), useReset("k"), useReset("b"), useReset("h")]
  const setJumps = useSetAtom(jumpsAtom)

  return (
    <section className={sidebarStyle.card} aria-labelledby={titleId}>
      <div className={style.head}>
        <h2 id={titleId} className={sidebarStyle.card_title}>
          Transform
        </h2>
        {resets.some((r) => r.changed) && (
          <button
            type="button"
            className={style.reset_all}
            onClick={() => {
              setJumps(resets.map((r) => r.jump))
              resets.forEach((r) => r.reset())
            }}
          >
            <ResetIcon />
            Reset all
          </button>
        )}
      </div>
      <TransformRow name="y scale" param="a" />
      <TransformRow name="y shift" param="k" />
      <div className={style.rule} aria-hidden="true" />
      <TransformRow name="x scale" param="b" />
      <TransformRow name="x shift" param="h" />
    </section>
  )
}
