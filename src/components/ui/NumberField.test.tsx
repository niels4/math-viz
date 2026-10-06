import { useState } from "react"
import { describe, expect, it } from "vitest"

import { act, render, toElement } from "#test"

import { NumberField } from "./NumberField"

const setInput = (input: HTMLInputElement, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  if (setter === undefined) {
    throw new Error("no native value setter")
  }
  setter.call(input, next)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

const type = (input: HTMLInputElement, next: string) => {
  act(() => {
    setInput(input, next)
  })
}

function Harness({ initial = 0, seen }: { initial?: number; seen?: (next: number) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <NumberField
      testId="n"
      {...{
        value,
        onChange: (next: number) => {
          seen?.(next)
          setValue(next)
        },
      }}
    />
  )
}

const renderInput = async (props?: { initial?: number; seen?: (next: number) => void }) => {
  const screen = await render(<Harness {...props} />)
  return toElement(screen.getByTestId("n")) as HTMLInputElement
}

describe("NumberField", () => {
  it("mirrors the numeric value", async () => {
    expect((await renderInput({ initial: 2.5 })).value).toBe("2.5")
  })

  it("propagates complete numbers live", async () => {
    const seen: number[] = []
    const input = await renderInput({ seen: (next) => seen.push(next) })
    type(input, "12")
    expect(seen).toEqual([12])
    expect(input.value).toBe("12")
  })

  it("holds a lone minus without propagating NaN", async () => {
    const seen: number[] = []
    const input = await renderInput({ seen: (next) => seen.push(next) })
    type(input, "-")
    expect(seen).toEqual([])
    expect(input.value).toBe("-")
    type(input, "-5")
    expect(seen).toEqual([-5])
    expect(input.value).toBe("-5")
  })

  it("clears without snapping the value to 0", async () => {
    const seen: number[] = []
    const input = await renderInput({ initial: 3, seen: (next) => seen.push(next) })
    type(input, "")
    expect(seen).toEqual([])
    expect(input.value).toBe("")
  })

  it("blur reverts incomplete text to the last valid value", async () => {
    const input = await renderInput({ initial: 3 })
    act(() => {
      input.focus()
    })
    type(input, "-")
    expect(input.value).toBe("-")
    act(() => {
      input.blur()
    })
    expect(input.value).toBe("3")
  })
})
