import { useSearchParams, useSetSearchParams } from "#src/components/router/router-hooks.ts"

import styles from "./basics.module.css"

export default function SearchParamsPage() {
  const searchParams = useSearchParams()
  const count = Number(searchParams.get("count") ?? 0)
  const setSearchParams = useSetSearchParams()

  const onClickMeClick = () => {
    setSearchParams({ count: count + 1 })
  }

  const onResetClick = () => {
    setSearchParams({ count: null })
  }

  return (
    <main className={styles.wrapper}>
      <h1>Search Params Example</h1>

      <p>
        <strong>Clicks:</strong>&nbsp;
        <span data-testid="click-count" id="click-count">
          {count}
        </span>
      </p>

      <div className={styles.button_row}>
        <button id="click-me-button" className={styles.btn_primary} onClick={onClickMeClick}>
          Click me
        </button>
        <button id="reset-button" className={styles.btn_secondary} onClick={onResetClick}>
          Reset
        </button>
      </div>

      <a href="#">Back to Root Page</a>
    </main>
  )
}
