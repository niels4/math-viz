import { afterEach, describe, expect, it } from "vitest"

import { render, updateLocationHash } from "#test"

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
})
