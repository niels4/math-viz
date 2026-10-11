import { useLayoutEffect, type RefObject } from "react"

/** calc-size() sizes a box from its content (Chromium 129+): there the CSS rounds the runs. */
const cssRounds =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("width", "calc-size(max-content, size)")

// Figma rounds every text box up to whole px and sets the boxes side by
// side (AGENTS.md › Figma rounds every text box). A stylesheet does that
// with `width: calc-size(max-content, round(up, size, 1px))`; in engines
// without calc-size (Firefox, WebKit) this does it after each render: each
// run the owner names is measured at its own width, then fixed at that
// width rounded up. The runs must be boxes (inline-block) for a width.
export function useWholePxRuns(
  rootRef: RefObject<HTMLElement | null>,
  runsOf: (root: HTMLElement) => HTMLElement[],
  enabled: boolean,
) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!enabled || cssRounds || root === null) {
      return
    }
    const runs = runsOf(root)
    for (const run of runs) {
      run.style.removeProperty("width")
    }
    const widths = runs.map((run) => run.getBoundingClientRect().width)
    runs.forEach((run, i) => {
      const width = widths[i] ?? 0
      if (width > 0) {
        run.style.width = `${Math.ceil(width - 1e-3)}px`
      }
    })
  })
}
