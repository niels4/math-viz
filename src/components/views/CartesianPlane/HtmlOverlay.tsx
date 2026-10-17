import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import style from "./CartesianPlain.module.css"
import { centerParam, scaleParam } from "./queryParams"

export const HtmlOverlay = () => {
  const [, setCenter] = useQueryParam(centerParam)
  const [, setScale] = useQueryParam(scaleParam)

  return (
    <div className={style.html_overlay}>
      <div className={`${style.corner_chrome} ${style.top_left_chrome}`} />
      <div className={`${style.corner_chrome} ${style.top_right_chrome}`} />
      <div className={`${style.corner_chrome} ${style.bottom_left_chrome}`} />
      <div className={`${style.corner_chrome} ${style.bottom_right_chrome}`} />
      <button
        type="button"
        className={style.return_to_center}
        aria-label="Return to center"
        onClick={() => {
          setCenter(centerParam.defaultValue, { flush: true })
          setScale(scaleParam.defaultValue, { flush: true })
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="6.5" />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
          <path d="M12 2.5V5.5M12 18.5V21.5M2.5 12H5.5M18.5 12H21.5" />
        </svg>
      </button>
    </div>
  )
}
