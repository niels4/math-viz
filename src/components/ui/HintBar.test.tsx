import { describe, expect, it } from "vitest"

import { render, toElement } from "#test"

import { HintBar } from "./HintBar.tsx"

describe("HintBar", () => {
  it("sets words, maths and keys as phrases a screen reader hears with spaces", async () => {
    const screen = await render(
      <HintBar
        testId="hint"
        hint={{
          phrases: [
            { text: "Drag" },
            { math: "P" },
            { text: "along the curve ·" },
            { key: "←" },
            { key: "Shift" },
          ],
        }}
      />,
    )
    const bar = toElement(screen.getByTestId("hint"))
    expect(bar.getAttribute("role")).toBe("status")
    // A "·" keeps to its word with a no-break space.
    expect(bar.textContent).toBe("Drag P along the curve\u00a0· Left arrow Shift")
    expect([...bar.querySelectorAll("var")].map((v) => v.textContent)).toEqual(["P"])
    const keys = [...bar.querySelectorAll("kbd")]
    expect(keys.map((k) => k.textContent)).toEqual(["Left arrow", "Shift"])
    // The arrow is drawn: the fonts lack U+2190–2193.
    expect(keys[0]?.querySelector("svg")).not.toBeNull()
  })

  it("marks an error hint", async () => {
    const screen = await render(
      <HintBar testId="hint" hint={{ phrases: [{ text: "Type a number such as 1.5 ·" }], tone: "error" }} />,
    )
    expect(toElement(screen.getByTestId("hint")).getAttribute("data-tone")).toBe("error")
  })
})
