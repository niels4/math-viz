import { useRef, useState } from "react"
import { describe, expect, it } from "vitest"

import { act, render, toElement } from "#test"

import { NumberField, type NumberFieldEdit, type NumberFieldEnd, type NumberFieldHandle } from "./NumberField"

const setInput = (input: HTMLInputElement, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  if (setter === undefined) {
    throw new Error("no native value setter")
  }
  setter.call(input, next)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

type Seen = { commits: number[]; edits: (NumberFieldEdit | null)[]; ends: NumberFieldEnd[] }

function Harness({ initial, seen, positive }: { initial: number; seen: Seen; positive: boolean }) {
  const [value, setValue] = useState(initial)
  const field = useRef<NumberFieldHandle | null>(null)
  return (
    <>
      <NumberField
        ref={field}
        testId="n"
        label="b: Horizontal scale, value"
        value={value}
        onCommit={(next) => {
          seen.commits.push(next)
          setValue(next)
        }}
        {...(positive ? { validate: (next: number) => (next > 0 ? null : "not-positive") } : {})}
        onEditChange={(edit) => seen.edits.push(edit)}
        onEditEnd={(how) => seen.ends.push(how)}
      />
      <button type="button" data-testid="open" onClick={() => field.current?.edit()}>
        type
      </button>
    </>
  )
}

const renderField = async ({ initial = 1.04, positive = false } = {}) => {
  const seen: Seen = { commits: [], edits: [], ends: [] }
  const screen = await render(<Harness initial={initial} seen={seen} positive={positive} />)
  const input = toElement(screen.getByTestId("n")) as HTMLInputElement
  const open = () => {
    act(() => {
      input.focus()
    })
  }
  const type = (text: string) => {
    act(() => {
      setInput(input, text)
    })
  }
  const press = (key: string) => {
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }))
    })
  }
  return { input, seen, open, type, press, screen }
}

describe("NumberField", () => {
  it("shows the stored value through the number rule, read-only until opened", async () => {
    const { input } = await renderField({ initial: -1.035 })
    expect(input.value).toBe("−1.035")
    expect(input.readOnly).toBe(true)
    expect(input.getAttribute("aria-label")).toBe("b: Horizontal scale, value")
  })

  it("opens on focus with its text selected, and Enter commits rounded to 3 dp", async () => {
    const { input, open, type, press, seen } = await renderField()
    open()
    expect(input.readOnly).toBe(false)
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(4)
    type("1.03511")
    expect(seen.commits).toEqual([])
    press("Enter")
    expect(seen.commits).toEqual([1.035])
    expect(seen.ends).toEqual(["commit"])
    expect(input.value).toBe("1.035")
    expect(input.readOnly).toBe(true)
  })

  it("reads either minus, and reopens while it keeps the focus (Enter, a click)", async () => {
    const { input, open, type, press, seen } = await renderField()
    open()
    type("−2")
    press("Enter")
    press("Enter")
    type("-0.5")
    press("Enter")
    act(() => {
      input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }))
    })
    type("3")
    press("Enter")
    expect(seen.commits).toEqual([-2, -0.5, 3])
  })

  it("keeps refused text open and marked, and typing clears the mark", async () => {
    const { input, open, type, press, seen } = await renderField()
    open()
    type("1.0.4")
    press("Enter")
    expect(seen.commits).toEqual([])
    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(input.value).toBe("1.0.4")
    expect(seen.edits).toEqual([{ error: null }, { error: "invalid" }])
    type("1.0")
    expect(input.getAttribute("aria-invalid")).toBeNull()
    expect(seen.edits.at(-1)).toEqual({ error: null })
  })

  it("refuses what the owner refuses", async () => {
    const { input, open, type, press, seen } = await renderField({ positive: true })
    open()
    type("0")
    press("Enter")
    expect(seen.commits).toEqual([])
    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(seen.edits.at(-1)).toEqual({ error: "not-positive" })
  })

  it("Esc puts the value back", async () => {
    const { input, open, type, press, seen } = await renderField()
    open()
    type("7")
    press("Escape")
    expect(seen.commits).toEqual([])
    expect(seen.ends).toEqual(["cancel"])
    expect(input.value).toBe("1.04")
  })

  it("↑ ↓ nudge 0.01 and apply at once; Esc undoes them", async () => {
    const { input, open, press, seen } = await renderField()
    open()
    press("ArrowUp")
    press("ArrowUp")
    expect(input.value).toBe("1.06")
    expect(seen.commits).toEqual([1.05, 1.06])
    press("Escape")
    expect(seen.commits).toEqual([1.05, 1.06, 1.04])
  })

  it("a nudge onto a refused value does nothing", async () => {
    const { input, open, press, seen } = await renderField({ initial: 0.01, positive: true })
    open()
    press("ArrowDown")
    expect(input.value).toBe("0.01")
    expect(seen.commits).toEqual([])
  })

  it("leaving commits a number and puts back anything else", async () => {
    const { input, open, type, seen } = await renderField()
    open()
    type("2.5")
    act(() => {
      input.blur()
    })
    expect(seen.commits).toEqual([2.5])
    expect(seen.ends).toEqual(["blur"])
    open()
    type("-")
    act(() => {
      input.blur()
    })
    expect(seen.commits).toEqual([2.5])
    expect(input.value).toBe("2.5")
  })

  it("the owner opens it with edit()", async () => {
    const { input, screen, seen } = await renderField()
    act(() => {
      toElement(screen.getByTestId("open")).dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(document.activeElement).toBe(input)
    expect(input.readOnly).toBe(false)
    expect(seen.edits).toEqual([{ error: null }])
  })
})
