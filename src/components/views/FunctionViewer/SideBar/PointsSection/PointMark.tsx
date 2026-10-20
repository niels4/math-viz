import style from "./PointMark.module.css"

const SIZE = 18

export const PointMark = ({ parked = false }: { parked?: boolean }) => {
  const c = SIZE / 2
  return (
    <svg className={style.mark} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <circle className={parked ? style.parked : style.ring} cx={c} cy={c} r={c - 1} strokeWidth={2} />
      {!parked && <circle className={style.core} cx={c} cy={c} r={SIZE / 4} />}
    </svg>
  )
}
