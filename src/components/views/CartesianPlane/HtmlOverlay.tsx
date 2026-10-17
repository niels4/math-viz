import style from "./CartesianPlain.module.css"

export const HtmlOverlay = () => {
  return (
    <div className={style.html_overlay}>
      <div className={`${style.corner_chrome} ${style.top_left_chrome}`} />
      <div className={`${style.corner_chrome} ${style.top_right_chrome}`} />
      <div className={`${style.corner_chrome} ${style.bottom_left_chrome}`} />
      <div className={`${style.corner_chrome} ${style.bottom_right_chrome}`} />
    </div>
  )
}
