import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { render, toElement, updateLocationHash } from "#test"

import { planeSizeAtom } from "../../../CartesianPlane/state"
import { PRow } from "./PRow"

// A 500 × 400 px plane at the default camera shows y from -4 to 4.
beforeEach(() => {
  getDefaultStore().set(planeSizeAtom, { width: 500, height: 400 })
})

afterEach(async () => {
  getDefaultStore().set(planeSizeAtom, { width: 0, height: 0 })
  await updateLocationHash("")
})

const headText = async (hash: string) => {
  await updateLocationHash(hash)
  const screen = await render(<PRow />)
  return toElement(screen.getByRole("slider", { name: "x of P" })).parentElement?.textContent
}

describe("P's head row", () => {
  it("reads f(P) through the picked function and transform", async () => {
    const text = await headText("#?func=x2&p=1.5&k=-1")
    expect(text).toContain("pinned")
    expect(text).toContain("f(1.50) = 1.25")
  })

  it("says ≈ when two decimals round f(P)", async () => {
    expect(await headText("#?func=sinx&p=1")).toContain("f(1.00) ≈ 0.84")
  })

  it("says when f(P) lies above the view", async () => {
    const text = await headText("#?func=x2&p=3")
    expect(text).toContain("above the view")
    expect(text).not.toContain("pinned")
  })

  it("says when f(P) lies below the view, with a true minus", async () => {
    const text = await headText("#?p=-5")
    expect(text).toContain("below the view")
    expect(text).toContain("f(−5.00) = −5.00")
  })
})
