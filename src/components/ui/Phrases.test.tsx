import { describe, expect, it } from "vitest"

import { render, toElement } from "#test"

import { Phrases } from "./Phrases.tsx"

const items = (root: Element) => [...root.children].map((item) => item.textContent)

describe("Phrases", () => {
  it("keeps each phrase whole by default", async () => {
    const screen = await render(
      <p data-testid="copy">
        <Phrases phrases={[{ text: "Drag the ruler ·" }, { key: "Shift" }, { text: "fine" }]} />
      </p>,
    )
    expect(items(toElement(screen.getByTestId("copy")))).toEqual(["Drag the ruler\u00a0·", "Shift", "fine"])
  })

  it("sets each word apart with `words`, as fvRich lays out prose, a · kept with its word", async () => {
    const screen = await render(
      <p data-testid="copy">
        <Phrases
          words
          phrases={[
            { math: "f(x) = x²" },
            { text: "turns every" },
            { math: "x" },
            { text: "into a height ·" },
          ]}
        />
      </p>,
    )
    const copy = toElement(screen.getByTestId("copy"))
    expect(items(copy)).toEqual(["f(x) = x²", "turns", "every", "x", "into", "a", "height\u00a0·"])
    // Read aloud with a space between items.
    expect(copy.textContent).toBe("f(x) = x² turns every x into a height\u00a0·")
  })
})
