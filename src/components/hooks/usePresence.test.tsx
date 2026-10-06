import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { act, render, toElement } from "#test"

import { useLeaving, usePresence } from "./usePresence.ts"

function Probe({ exitMs }: { exitMs: number }) {
  const [open, setOpen] = useState(true)
  const presence = usePresence(open, exitMs)
  return (
    <button type="button" data-testid="toggle" data-presence={presence} onClick={() => setOpen((o) => !o)} />
  )
}

type Screen = Awaited<ReturnType<typeof render>>

const toggle = (screen: Screen) => {
  act(() => {
    toElement(screen.getByTestId("toggle")).dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

const presence = (screen: Screen) => toElement(screen.getByTestId("toggle")).getAttribute("data-presence")

const wait = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe("usePresence", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("stays closing for the exit time after it closes, then closes", async () => {
    const screen = await render(<Probe exitMs={120} />)
    expect(presence(screen)).toBe("open")
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    toggle(screen)
    expect(presence(screen)).toBe("closing")
    wait(119)
    expect(presence(screen)).toBe("closing")
    wait(1)
    expect(presence(screen)).toBe("closed")
  })

  it("opens again mid-exit", async () => {
    const screen = await render(<Probe exitMs={120} />)
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    toggle(screen)
    wait(40)
    toggle(screen)
    expect(presence(screen)).toBe("open")
    wait(200)
    expect(presence(screen)).toBe("open")
  })

  it("closes at once with no exit time", async () => {
    const screen = await render(<Probe exitMs={0} />)
    toggle(screen)
    expect(presence(screen)).toBe("closed")
  })
})

function LeavingProbe() {
  const [value, setValue] = useState<"a" | "k" | null>("a")
  const { shown, closing } = useLeaving(value, 120)
  return (
    <>
      <span data-testid="shown" data-closing={closing || undefined}>
        {shown ?? "none"}
      </span>
      <button type="button" data-testid="to-k" onClick={() => setValue("k")} />
      <button type="button" data-testid="to-none" onClick={() => setValue(null)} />
    </>
  )
}

describe("useLeaving", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps the last value through the exit, and swaps at once between values", async () => {
    const screen = await render(<LeavingProbe />)
    const press = (id: string) => {
      act(() => {
        toElement(screen.getByTestId(id)).dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
    }
    const shown = () => toElement(screen.getByTestId("shown"))
    expect(shown().textContent).toBe("a")
    press("to-k")
    expect(shown().textContent).toBe("k")
    expect(shown().hasAttribute("data-closing")).toBe(false)
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    press("to-none")
    expect(shown().textContent).toBe("k")
    expect(shown().hasAttribute("data-closing")).toBe(true)
    wait(120)
    expect(shown().textContent).toBe("none")
  })
})
