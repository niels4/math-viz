import { describe, expect, it } from "vitest"

import { isBrowser, render, toElement } from "#test"

import { Select } from "./Select.tsx"

const LONG = "A very long option that runs past the chevron of the select"

describe("Select", () => {
  // jsdom draws no CSS: the browser runs it. TextField's .field shares the
  // select's layer and loads after its module, so a tie on padding would go
  // to the field's shorthand.
  it.runIf(isBrowser())("keeps a long option's text clear of its chevron", async () => {
    const screen = await render(
      <div style={{ width: "220px" }}>
        <Select testId="select" value="long" onChange={() => {}} options={[{ value: "long", label: LONG }]} />
      </div>,
    )
    const select = toElement(screen.getByTestId("select"))
    const chevron = select.parentElement?.querySelector("[aria-hidden=true]")
    expect(chevron).toBeInstanceOf(HTMLElement)
    const style = getComputedStyle(select)
    expect(style.paddingRight).toBe("38px")
    // The option's text runs to the content box's right edge.
    const textRight =
      select.getBoundingClientRect().right -
      parseFloat(style.borderRightWidth) -
      parseFloat(style.paddingRight)
    expect(textRight).toBeLessThanOrEqual(chevron?.getBoundingClientRect().left ?? 0)
  })
})
