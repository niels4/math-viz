import { useRef } from "react"
import { describe, expect, it } from "vitest"

import { act, render, toElement } from "#test"

import { useHover } from "./useHover.ts"

function Probe({ reports }: { reports: boolean[] }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const hover = useHover(ref, (hovered) => reports.push(hovered))
  return (
    <>
      <div
        ref={ref}
        data-testid="probe"
        data-hovered={hover.hovered || undefined}
        onPointerEnter={hover.onPointerEnter}
        onPointerLeave={hover.onPointerLeave}
      >
        <input data-testid="inner" />
      </div>
      <p data-testid="outside">outside</p>
    </>
  )
}

// A move from one element to another, as a browser sends it: out, then over.
const move = (from: HTMLElement | null, to: HTMLElement) => {
  act(() => {
    from?.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: to }))
    to.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, relatedTarget: from }))
  })
}

describe("useHover", () => {
  it("follows the pointer in and out, and reports each change", async () => {
    const reports: boolean[] = []
    const screen = await render(<Probe reports={reports} />)
    const probe = toElement(screen.getByTestId("probe"))
    const inner = toElement(screen.getByTestId("inner"))
    const outside = toElement(screen.getByTestId("outside"))
    move(outside, inner)
    expect(probe.hasAttribute("data-hovered")).toBe(true)
    move(inner, outside)
    expect(probe.hasAttribute("data-hovered")).toBe(false)
    expect(reports).toEqual([true, false])
  })

  it("ends on a pointerover elsewhere when the leave never came", async () => {
    const reports: boolean[] = []
    const screen = await render(<Probe reports={reports} />)
    const probe = toElement(screen.getByTestId("probe"))
    const inner = toElement(screen.getByTestId("inner"))
    move(null, inner)
    expect(probe.hasAttribute("data-hovered")).toBe(true)
    // Chromium's quirk: no pointerout from the input, only the next pointerover.
    move(null, toElement(screen.getByTestId("outside")))
    expect(probe.hasAttribute("data-hovered")).toBe(false)
    expect(reports).toEqual([true, false])
  })
})
