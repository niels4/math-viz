import { flushSync } from "react-dom"

/** Run a state change inside a View Transition so the page crossfades to its new look.
 * flushSync makes React commit the DOM before the browser snapshots the new state.
 * Browsers without the API just apply the change. */
export const withViewTransition = (change: () => void): void => {
  if (typeof document.startViewTransition !== "function") {
    change()
    return
  }
  document.startViewTransition(() => {
    flushSync(change)
  })
}
