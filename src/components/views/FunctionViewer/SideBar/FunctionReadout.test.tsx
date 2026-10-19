import "#src/style/global.css"
import { afterEach, describe, expect, it } from "vitest"

import { style_vars } from "#src/style/style_vars.module.css"
import { act, isBrowser, render, toElement, updateLocationHash } from "#test"

import { FunctionReadout } from "./FunctionReadout"

afterEach(async () => {
  await updateLocationHash("")
})

const readout = async (hash: string) => {
  await updateLocationHash(hash)
  const screen = await render(<FunctionReadout />)
  return screen.getByRole("status")
}

describe("the function readout", () => {
  it("shows the bare function when every value is at its default", async () => {
    // A fresh page graphs x, untransformed.
    await expect.element(await readout("")).toHaveTextContent("f(x) = x")
  })

  it("prints a link's values with two decimals and true minus signs", async () => {
    // x² flipped and stretched by a, moved left by h and up by k.
    await expect
      .element(await readout("#?func=x2&a=-1.5&h=-2&k=0.75"))
      .toHaveTextContent("f(x) = −1.50(x + 2.00)2 + 0.75")
  })

  it("leaves out the values at their defaults", async () => {
    // Only k is off its default, so x³ keeps its bare x.
    await expect.element(await readout("#?func=x3&k=-1")).toHaveTextContent("f(x) = x3 − 1.00")
  })

  it("scales a bare x without parentheses", async () => {
    await expect.element(await readout("#?a=3")).toHaveTextContent("f(x) = 3.00x")
  })

  it("puts a scaled x in parentheses when it is shifted", async () => {
    await expect.element(await readout("#?a=3&h=1")).toHaveTextContent("f(x) = 3.00(x − 1.00)")
  })

  it("stacks the inside of sin over b", async () => {
    // The fraction reads its top (x − 1.00), then its bottom (0.50).
    await expect
      .element(await readout("#?func=sinx&a=2&b=0.5&h=1&k=-1"))
      .toHaveTextContent("f(x) = 2.00 sin(x − 1.000.50) − 1.00")
  })

  it.runIf(isBrowser())("shrinks a long equation to fit the sidebar", async () => {
    // Every value set, in a column as wide as the sidebar's card.
    await updateLocationHash("#?a=20&b=30&h=10&k=12.5")
    const screen = await render(
      <div className={style_vars} style={{ width: 320 }}>
        <FunctionReadout />
      </div>,
    )
    const output = toElement(screen.getByRole("status"))
    await expect.element(output).toHaveTextContent("f(x) = 20.00(x − 10.0030.00) + 12.50")

    // The line ends just inside the column instead of running past it.
    const line = toElement(output.firstElementChild)
    const edge = output.getBoundingClientRect().right
    await expect.poll(() => line.getBoundingClientRect().right).toBeLessThanOrEqual(edge)
    expect(line.getBoundingClientRect().right).toBeGreaterThan(edge - 4)
  })
})

const form = async (hash: string) => {
  await updateLocationHash(hash)
  const screen = await render(<FunctionReadout />)
  return screen.getByTestId("function-form")
}

describe("the function's form", () => {
  it("shows every letter, even for values at their defaults", async () => {
    // Only k is set, but the form under x² still shows a, h and b.
    await expect.element(await form("#?func=x2&k=1")).toHaveTextContent("f(x) = a(x − hb)2 + k")
  })

  it("puts a before sin", async () => {
    await expect.element(await form("#?func=sinx")).toHaveTextContent("f(x) = a sin(x − hb) + k")
  })
})

const point = (el: HTMLElement, type: "pointerover" | "pointerout") =>
  act(() => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" })))

describe("highlighting a parameter", () => {
  it("lights its term in both lines while the pointer is on either one", async () => {
    // x² scaled by a = 2: a shows in both lines, h only in the form.
    await updateLocationHash("#?func=x2&a=2")
    const screen = await render(<FunctionReadout />)
    await expect.element(screen.getByRole("status")).toHaveTextContent("f(x) = 2.00x2")
    const values = toElement(screen.getByRole("status"))
    const letters = toElement(screen.getByTestId("function-form"))
    const term = (line: HTMLElement, param: string) =>
      toElement(line.querySelector(`[data-param="${param}"]`))
    const lit = (line: HTMLElement, param: string) => term(line, param).hasAttribute("data-lit")

    // Nothing is lit at rest.
    expect(lit(values, "a")).toBe(false)
    expect(lit(letters, "a")).toBe(false)

    // Pointing at 2.00 lights a in both lines, and nothing else.
    point(term(values, "a"), "pointerover")
    expect(lit(values, "a")).toBe(true)
    expect(lit(letters, "a")).toBe(true)
    expect(lit(letters, "h")).toBe(false)

    // Moving off it puts both out.
    point(term(values, "a"), "pointerout")
    expect(lit(values, "a")).toBe(false)
    expect(lit(letters, "a")).toBe(false)

    // The form's h lights though the value line has no h.
    point(term(letters, "h"), "pointerover")
    expect(lit(letters, "h")).toBe(true)
    point(term(letters, "h"), "pointerout")
    expect(lit(letters, "h")).toBe(false)
  })
})
