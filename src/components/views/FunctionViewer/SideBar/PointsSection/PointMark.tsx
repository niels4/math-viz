import style from "./PointMark.module.css"

const SIZE = 18

export const PointMark = ({
  shape = "bullseye",
  parked = false,
}: {
  shape?: "bullseye" | "ring"
  parked?: boolean
}) => {
  const c = SIZE / 2
  const ring = shape === "ring"
  const ringWidth = ring ? 2.5 : 2
  return (
    <svg className={style.mark} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <circle
        className={parked ? style.parked : ring ? style.probe : style.ring}
        cx={c}
        cy={c}
        r={c - ringWidth / 2}
        strokeWidth={ringWidth}
      />
      {!parked && (
        <circle className={ring ? style.centre : style.core} cx={c} cy={c} r={ring ? SIZE / 8 : SIZE / 4} />
      )}
    </svg>
  )
}
