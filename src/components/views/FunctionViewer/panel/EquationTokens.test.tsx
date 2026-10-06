import { describe, expect, it } from "vitest"

import { render } from "#test"

import { equationTokens } from "../math/equation.ts"
import { DEFAULT_PARAMS } from "../math/form.ts"
import { EquationTokens } from "./EquationTokens.tsx"

const renderEquation = async (...args: Parameters<typeof equationTokens>) => {
  await render(
    <p data-testid="eq">
      <EquationTokens tokens={equationTokens(...args)} />
    </p>,
  )
  const root = document.querySelector('[data-testid="eq"]')
  if (root === null) {
    throw new Error("no equation")
  }
  return root
}

describe("EquationTokens", () => {
  it("typesets R3: raised exponent, one span per value", async () => {
    const root = await renderEquation("x2", { ...DEFAULT_PARAMS, a: 2, h: -1, k: 1 }, "live")
    expect(root.querySelector("sup")?.textContent).toBe("2")
    const terms = [...root.querySelectorAll("[data-param]")].map((el) => [
      el.getAttribute("data-param"),
      el.textContent,
    ])
    expect(terms).toEqual([
      ["a", "2"],
      ["h", "+ 1"],
      ["k", "+ 1"],
    ])
  })

  it("stacks the scale as a fraction, with no code operators", async () => {
    const root = await renderEquation("x2", { ...DEFAULT_PARAMS, b: 2, h: 1 }, "live")
    const den = root.querySelector('[data-param="b"]')
    expect(den?.textContent).toBe("2")
    expect(root.textContent).not.toContain("*")
    expect(root.textContent).not.toContain("/")
  })

  it("marks the form line's ghost slots", async () => {
    const root = await renderEquation("x2", { ...DEFAULT_PARAMS, a: 2 }, "form")
    const ghosts = [...root.querySelectorAll("[data-ghost]")].map((el) => el.getAttribute("data-param"))
    expect(ghosts).toEqual(["h", "b", "k"])
  })

  it("lights the active value's terms, binds each term and hangs what goes under it", async () => {
    const tokens = equationTokens("x2", { ...DEFAULT_PARAMS, a: 2, k: 1 }, "live")
    await render(
      <p data-testid="eq">
        <EquationTokens
          tokens={tokens}
          lit={["k"]}
          bindTerm={(param) => ({ title: `drag ${param}` })}
          renderUnder={(param) => (param === "k" ? <i data-testid="under-k">tip</i> : null)}
        />
      </p>,
    )
    const term = (param: string) => document.querySelector(`[data-param="${param}"]`)
    expect(term("k")?.hasAttribute("data-lit")).toBe(true)
    expect(term("a")?.hasAttribute("data-lit")).toBe(false)
    expect(term("a")?.getAttribute("title")).toBe("drag a")
    expect(term("k")?.querySelector('[data-testid="under-k"]')?.textContent).toBe("tip")
  })
})
