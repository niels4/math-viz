import style from "./CartesianPlain.module.css"

export const HtmlOverlay = () => {
  return (
    <div className={style.html_overlay}>
      <div className={style.top_left_chrome} />
      <div className={style.top_right_chrome} />
      <div className={style.bottom_left_chrome} />
      <div className={style.bottom_right_chrome} />
    </div>
  )
}
