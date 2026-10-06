import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { act, render, toElement } from "#test"

import { SegmentedControl, type SegmentedOption } from "./SegmentedControl.tsx"

type Slug = "x" | "x2" | "x3" | "sin"

const OPTIONS: readonly SegmentedOption<Slug>[] = [
  { value: "x", label: "x" },
  { value: "x2", label: "x²", ariaLabel: "x squared" },
  { value: "x3", label: "x³", ariaLabel: "x cubed" },
  { value: "sin", label: "sin x" },
]

function Picker({ onChange }: { onChange: (next: Slug) => void }) {
  const [value, setValue] = useState<Slug>("x2")
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
      label="Base function"
      testId="fn"
    />
  )
}

const radios = () => [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
const checked = () => radios().find((r) => r.getAttribute("aria-checked") === "true")?.dataset["testid"]
const focused = () => (document.activeElement as HTMLElement | null)?.dataset["testid"]
const press = (key: string) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
  act(() => {
    document.activeElement?.dispatchEvent(event)
  })
  return event
}

describe("SegmentedControl", () => {
  it("is one named radiogroup with a single tab stop on the checked option", async () => {
    await render(<Picker onChange={() => {}} />)
    const group = document.querySelector('[role="radiogroup"]')
    expect(group?.getAttribute("aria-label")).toBe("Base function")
    expect(radios().map((r) => [r.dataset["testid"], r.getAttribute("aria-checked"), r.tabIndex])).toEqual([
      ["fn-x", "false", -1],
      ["fn-x2", "true", 0],
      ["fn-x3", "false", -1],
      ["fn-sin", "false", -1],
    ])
    expect(radios()[1]?.getAttribute("aria-label")).toBe("x squared")
  })

  it("selects on click, and a click on the checked option changes nothing", async () => {
    const onChange = vi.fn<(next: Slug) => void>()
    const screen = await render(<Picker onChange={onChange} />)
    act(() => {
      toElement(screen.getByTestId("fn-sin")).click()
    })
    expect(checked()).toBe("fn-sin")
    act(() => {
      toElement(screen.getByTestId("fn-sin")).click()
    })
    expect(onChange.mock.calls).toEqual([["sin"]])
  })

  it("moves the selection and the focus with the arrows, wrapping, and jumps with Home and End", async () => {
    const onChange = vi.fn<(next: Slug) => void>()
    const screen = await render(<Picker onChange={onChange} />)
    act(() => {
      toElement(screen.getByTestId("fn-x2")).focus()
    })
    const steps: [string, string][] = [
      ["ArrowRight", "fn-x3"],
      ["ArrowRight", "fn-sin"],
      ["ArrowRight", "fn-x"],
      ["ArrowLeft", "fn-sin"],
      ["Home", "fn-x"],
      ["End", "fn-sin"],
      ["ArrowUp", "fn-x3"],
      ["ArrowDown", "fn-sin"],
    ]
    for (const [key, expected] of steps) {
      expect(press(key).defaultPrevented).toBe(true)
      expect([key, checked(), focused()]).toEqual([key, expected, expected])
    }
    expect(onChange).toHaveBeenCalledTimes(steps.length)
    expect(
      radios()
        .filter((r) => r.tabIndex === 0)
        .map((r) => r.dataset["testid"]),
    ).toEqual(["fn-sin"])
  })

  it("leaves other keys alone", async () => {
    const onChange = vi.fn<(next: Slug) => void>()
    const screen = await render(<Picker onChange={onChange} />)
    act(() => {
      toElement(screen.getByTestId("fn-x2")).focus()
    })
    expect(press("Enter").defaultPrevented).toBe(false)
    expect(press("a").defaultPrevented).toBe(false)
    expect(checked()).toBe("fn-x2")
    expect(onChange).not.toHaveBeenCalled()
  })
})
