import { useLayoutEffect, useRef, useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { motionMedia, runLinear } from "#src/test/motion.ts"
import { isBrowser, render } from "#test"

import { Callout, type CalloutCaret } from "./Callout.tsx"

const PLACE = { x: 200, y: 200, width: 300, height: 160 }

/** How the caret's edge moves toward what the caret points at: its index in a box, and the sign. */
const LEAD = { left: [0, -1], top: [1, -1], bottom: [3, 1] } as const

// An owner as the explainer and the tour are: it measures its callout
// before it places it, so the callout gets its first style unplaced, its
// caret on the left.
function MeasuredFirst({ caret }: { caret: CalloutCaret }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [placed, setPlaced] = useState(false)
  useLayoutEffect(() => {
    if ((ref.current?.offsetHeight ?? 0) > 0) {
      setPlaced(true)
    }
  }, [])
  return (
    <Callout
      ref={ref}
      x={placed ? PLACE.x : 0}
      y={placed ? PLACE.y : 0}
      width={PLACE.width}
      tone="plain"
      caret={placed ? caret : { side: "left", at: 20 }}
      testId="callout"
    >
      <div style={{ height: PLACE.height }} />
    </Callout>
  )
}

describe("Callout", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Watched at real speed, a change under about 100 ms reads as a pop: on
  // the enter spring squeezed into 320 ms, 4 px and 98 %, the explainer and
  // the tour card were 90 % opaque 66 ms after they showed, as the settings
  // menu was. They come out of their caret as the menu comes out of the
  // gear: from 90 % and 8 px toward what the caret points at, at the
  // spring's own pace, fading in over 160 ms, and go back over 200 ms.
  const renderMotion = async (caret: CalloutCaret, measuredFirst = false) => {
    vi.stubGlobal("matchMedia", motionMedia(false))
    await render(
      measuredFirst ? (
        <MeasuredFirst caret={caret} />
      ) : (
        <Callout x={PLACE.x} y={PLACE.y} width={PLACE.width} tone="plain" caret={caret} testId="callout">
          <div style={{ height: PLACE.height }} />
        </Callout>
      ),
    )
    const card = document.querySelector<HTMLElement>('[data-testid="callout"]')
    if (card === null) {
      throw new Error("the callout did not render")
    }
    const token = (name: string) => card.style.getPropertyValue(name)
    const fadeMs = Number.parseFloat(token("--motion-dur-fast"))
    const enterMs = Number.parseFloat(token("--motion-dur-enter-settle"))
    return {
      card,
      token,
      shownBy: (ms: number) => Math.min(1, ms / fadeMs),
      inBy: (ms: number) => runLinear(token("--motion-ease-enter"), ms / enterMs),
    }
  }

  it("comes out of its caret over about 200 ms and goes back over 200 ms", async () => {
    const { token, shownBy, inBy } = await renderMotion({ side: "left", at: 40 })
    expect(shownBy(50)).toBeLessThan(0.35)
    expect(shownBy(100)).toBeGreaterThan(0.5)
    expect(shownBy(100)).toBeLessThan(0.75)
    expect(shownBy(150)).toBeGreaterThan(0.9)
    expect(inBy(50)).toBeLessThan(0.3)
    expect(inBy(100)).toBeGreaterThan(0.5)
    expect(inBy(100)).toBeLessThan(0.7)
    expect(inBy(150)).toBeGreaterThan(0.8)
    expect(inBy(150)).toBeLessThan(0.95)
    expect(inBy(200)).toBeGreaterThan(0.98)
    // Going, linearly: half way back at 100 ms.
    expect(token("--motion-dur-overlay-leave")).toBe("200ms")
  })

  // The browser runs the CSS: the callout's own transitions, seeked. The
  // caret's edge travels 8 px toward what it points at while the card
  // grows from 90 % about the caret. An explainer above a low chip (a
  // stacked window) is measured with its caret on the left, then placed
  // above the chip: it still rises out of its caret.
  it.runIf(isBrowser()).each([
    { caret: { side: "left", at: 40 }, how: "placed", measuredFirst: false },
    { caret: { side: "top", at: 40 }, how: "placed", measuredFirst: false },
    { caret: { side: "bottom", at: 260 }, how: "placed", measuredFirst: false },
    { caret: { side: "bottom", at: 260 }, how: "placed after its owner measured it", measuredFirst: true },
  ] as const)("runs that motion in the browser, out of a caret on the $caret.side, $how", async (row) => {
    const { card, shownBy, inBy } = await renderMotion(row.caret, row.measuredFirst)
    const transitions = card.getAnimations()
    expect(transitions).toHaveLength(2)
    const rest = [PLACE.x, PLACE.y, PLACE.x + PLACE.width, PLACE.y + card.offsetHeight]
    const [lead, toward] = LEAD[row.caret.side]
    for (const ms of [50, 100, 150, 200]) {
      for (const transition of transitions) {
        transition.pause()
        transition.currentTime = ms
      }
      const style = getComputedStyle(card)
      const r = card.getBoundingClientRect()
      const box = [r.left, r.top, r.right, r.bottom]
      expect(Number(style.opacity)).toBeCloseTo(shownBy(ms), 2)
      expect(new DOMMatrixReadOnly(style.transform).a).toBeCloseTo(0.9 + 0.1 * inBy(ms), 3)
      expect(((box[lead] ?? 0) - (rest[lead] ?? 0)) * toward).toBeCloseTo(8 * (1 - inBy(ms)), 1)
    }
  })

  // jsdom draws no CSS and Vitest imports the module as its class names,
  // so this reads its source.
  it.skipIf(isBrowser())("runs that motion in its CSS, on those tokens", async () => {
    const fs = "node:fs"
    const { readFileSync } = (await import(/* @vite-ignore */ fs)) as {
      readFileSync: (path: string, encoding: "utf8") => string
    }
    const { dirname } = import.meta as ImportMeta & { dirname: string }
    const css = readFileSync(`${dirname}/Callout.module.css`, "utf8")
    // The fade is linear: Firefox paints an opacity eased past 1 washed out.
    expect(css).toContain("opacity var(--motion-dur-fast) linear")
    expect(css).toContain("transform var(--motion-dur-enter-settle) var(--motion-ease-enter)")
    expect(css).toContain("opacity var(--motion-dur-overlay-leave) linear")
    expect(css).toContain("transform var(--motion-dur-overlay-leave) linear")
    // From 90 %, about a point 80 px out past the caret: 8 px of travel.
    expect(css).toContain("--callout-from: scale(0.9);")
    expect(css).toContain("transform-origin: -80px var(--caret-at);")
    expect(css).toContain("transform-origin: var(--caret-at) -80px;")
    expect(css).toContain("transform-origin: var(--caret-at) calc(100% + 80px);")
    // From and back to, in @starting-style and [data-closing].
    expect(css.match(/opacity: 0;\s+transform: var\(--callout-from\);/g)).toHaveLength(2)
  })
})
