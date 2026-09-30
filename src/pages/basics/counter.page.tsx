import { useSearchParams, useSetSearchParams } from "#src/components/router/router-hooks.ts"

import styles from "./basics.module.css"

export default function CounterPage() {
  const searchParams = useSearchParams()
  const count = Number(searchParams.get("count") ?? 0)
  const setSearchParams = useSetSearchParams()

  const onIncrementClick = () => {
    setSearchParams({ count: count + 1 })
  }

  return (
    <main className={styles.wrapper}>
      <h1>Counter</h1>

      <p>
        <strong>Count:</strong>&nbsp;
        <span data-testid="counter-value">{count}</span>
      </p>

      <div className={styles.button_row}>
        <button className={styles.btn_primary} onClick={onIncrementClick}>
          Increment
        </button>
      </div>

      <p>
        <a href="#">Back to Root Page</a>
      </p>
    </main>
  )
}
