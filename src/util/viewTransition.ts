import { flushSync } from "react-dom"

export const withViewTransition = (change: () => void): void => {
  if (typeof document.startViewTransition !== "function") {
    change()
    return
  }
  document.startViewTransition(() => {
    flushSync(change)
  })
}
