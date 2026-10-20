import { useState } from "react"
import { describe, expect, it } from "vitest"

import { act, render, toElement } from "#test"

import { ScrubStrip } from "./ScrubStrip.tsx"

// The Alpha's y offset strip, as its sidebar sets it up, over an owner's state.
function Harness({ seen }: { seen: number[] }) {
  const [value, setValue] = useState(0)
  return (
    <ScrubStrip
      testId="strip"
      label="Scrub Y offset"
      kind="additive"
      step={0.02}
      defaultValue={0}
      value={value}
      onChange={(next) => {
        seen.push(next)
        setValue(next)
      }}
    />
  )
}

describe("Function Viewer Alpha's scrub strip", () => {
  // A trackpad can send notches faster than React renders: each one counts,
  // as it does one render apart (15 px at 0.02 a px: 0.3 a notch).
  it("counts each notch of a burst", async () => {
    const seen: number[] = []
    const screen = await render(<Harness seen={seen} />)
    const strip = toElement(screen.getByTestId("strip"))
    act(() => {
      for (let i = 0; i < 3; i++) {
        strip.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -100 }))
      }
    })
    expect(seen).toEqual([0.3, 0.6, 0.9])
    expect(strip.getAttribute("aria-valuetext")).toBe("0.9")
  })
})
