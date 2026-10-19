import "#src/style/global.css"
import { afterEach, describe, expect, it } from "vitest"

import { style_vars } from "#src/style/style_vars.module.css"
import { act, isBrowser, render, toElement, updateLocationHash } from "#test"

import { FunctionReadout } from "./FunctionReadout"

afterEach(async () => {
  await updateLocationHash("")
})

const readable = (el: Element): string =>
  [...el.childNodes]
    .map((node) => {
      if (!(node instanceof Element)) {
        return node.textContent ?? ""
      }
      return node.getAttribute("aria-hidden") === "true" ? "" : readable(node)
    })
    .join("")

const spoken = (el: Element): string => readable(el).replace(/\s+/g, " ").trim()

const readout = async (hash: string) => {
  await updateLocationHash(hash)
  const screen = await render(<FunctionReadout />)
  return toElement(screen.getByTestId("function-readout"))
}

describe("the function readout", () => {
  it("shows the bare function when every value is at its default", async () => {
    const line = await readout("")
    await expect.poll(() => spoken(line)).toBe("f(x) = x")
  })

  it("prints a link's values with two decimals and true minus signs", async () => {
    const line = await readout("#?func=x2&a=-1.5&h=-2&k=0.75")
    await expect.poll(() => spoken(line)).toBe("f(x) = −1.50(x + 2.00)² + 0.75")
  })

  it("leaves out the values at their defaults", async () => {
    const line = await readout("#?func=x3&k=-1")
    await expect.poll(() => spoken(line)).toBe("f(x) = x³ − 1.00")
  })

  it("scales a bare x without parentheses", async () => {
    const line = await readout("#?a=3")
    await expect.poll(() => spoken(line)).toBe("f(x) = 3.00x")
  })

  it("puts a scaled x in parentheses when it is shifted", async () => {
    const line = await readout("#?a=3&h=1")
    await expect.poll(() => spoken(line)).toBe("f(x) = 3.00(x − 1.00)")
  })

  it("reads x over b without parentheses", async () => {
    const line = await readout("#?b=2")
    await expect.poll(() => spoken(line)).toBe("f(x) = x/2.00")
  })

  it("reads a stacked fraction as top over bottom", async () => {
    const line = await readout("#?func=sinx&a=2&b=0.5&h=1&k=-1")
    await expect.poll(() => spoken(line)).toBe("f(x) = 2.00 sin((x − 1.00)/0.50) − 1.00")
  })

  it("leaves announcing changes to the transform controls", async () => {
    const line = await readout("#?a=2")
    await expect.poll(() => spoken(line)).toBe("f(x) = 2.00x")
    expect(line.closest("output, [role='status'], [aria-live]")).toBeNull()
  })

  it.runIf(isBrowser())("shrinks a long equation to fit the sidebar", async () => {
    await updateLocationHash("#?a=20&b=30&h=10&k=12.5")
    const screen = await render(
      <div className={style_vars} style={{ width: 320 }}>
        <FunctionReadout />
      </div>,
    )
    const row = toElement(screen.getByTestId("function-readout"))
    await expect.poll(() => spoken(row)).toBe("f(x) = 20.00((x − 10.00)/30.00) + 12.50")

    const line = toElement(row.firstElementChild)
    const edge = row.getBoundingClientRect().right
    await expect.poll(() => line.getBoundingClientRect().right).toBeLessThanOrEqual(edge)
    expect(line.getBoundingClientRect().right).toBeGreaterThan(edge - 4)
  })

  it.runIf(isBrowser())("keeps its height when a horizontal scale stacks a fraction", async () => {
    const screen = await render(
      <div className={style_vars}>
        <FunctionReadout />
      </div>,
    )
    const row = toElement(screen.getByTestId("function-readout"))
    await expect.poll(() => spoken(row)).toBe("f(x) = x")
    const height = row.getBoundingClientRect().height

    await updateLocationHash("#?b=2&h=1")
    await expect.poll(() => spoken(row)).toBe("f(x) = (x − 1.00)/2.00")
    expect(row.getBoundingClientRect().height).toBe(height)
  })
})

const form = async (hash: string) => {
  await updateLocationHash(hash)
  const screen = await render(<FunctionReadout />)
  return toElement(screen.getByTestId("function-form"))
}

describe("the function's form", () => {
  it("shows every letter, even for values at their defaults", async () => {
    const line = await form("#?func=x2&k=1")
    await expect.poll(() => spoken(line)).toBe("Form: f(x) = a((x − h)/b)² + k")
  })

  it("puts a before sin", async () => {
    const line = await form("#?func=sinx")
    await expect.poll(() => spoken(line)).toBe("Form: f(x) = a sin((x − h)/b) + k")
  })
})

const point = (el: HTMLElement, type: "pointerover" | "pointerout") =>
  act(() => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" })))

describe("highlighting a parameter", () => {
  it("lights its term in both lines while the pointer is on either one", async () => {
    await updateLocationHash("#?func=x2&a=2")
    const screen = await render(<FunctionReadout />)
    const values = toElement(screen.getByTestId("function-readout"))
    const letters = toElement(screen.getByTestId("function-form"))
    await expect.poll(() => spoken(values)).toBe("f(x) = 2.00x²")
    const term = (line: HTMLElement, param: string) =>
      toElement(line.querySelector(`[data-param="${param}"]`))
    const lit = (line: HTMLElement, param: string) => term(line, param).hasAttribute("data-lit")

    expect(lit(values, "a")).toBe(false)
    expect(lit(letters, "a")).toBe(false)

    point(term(values, "a"), "pointerover")
    expect(lit(values, "a")).toBe(true)
    expect(lit(letters, "a")).toBe(true)
    expect(lit(letters, "h")).toBe(false)

    point(term(values, "a"), "pointerout")
    expect(lit(values, "a")).toBe(false)
    expect(lit(letters, "a")).toBe(false)

    point(term(letters, "h"), "pointerover")
    expect(lit(letters, "h")).toBe(true)
    point(term(letters, "h"), "pointerout")
    expect(lit(letters, "h")).toBe(false)
  })
})
