import { describe, expect, it } from "vitest"

import { render } from "#test"

import { mathRuns } from "./mathRuns.ts"
import { MathText } from "./MathText.tsx"

describe("mathRuns", () => {
  it("sets single letters italic and the rest upright", () => {
    expect(mathRuns("f(x) =")).toEqual([
      { text: "f", italic: true, beforeParen: true },
      { text: "(", italic: false, beforeParen: false },
      { text: "x", italic: true, beforeParen: false },
      { text: ") =", italic: false, beforeParen: false },
    ])
  })

  it("keeps function names upright", () => {
    expect(mathRuns("sin x")).toEqual([
      { text: "sin ", italic: false, beforeParen: false },
      { text: "x", italic: true, beforeParen: false },
    ])
  })

  it("leaves numbers and operators as typed", () => {
    expect(mathRuns("+ 1.5")).toEqual([{ text: "+ 1.5", italic: false, beforeParen: false }])
  })
})

describe("MathText", () => {
  it("renders letters as var and keeps the text whole", async () => {
    await render(
      <p data-testid="m">
        <MathText text="g(x) + k" />
      </p>,
    )
    const p = document.querySelector('[data-testid="m"]')
    expect(p?.textContent).toBe("g(x) + k")
    expect([...(p?.querySelectorAll("var") ?? [])].map((v) => v.textContent)).toEqual(["g", "x", "k"])
  })
})
