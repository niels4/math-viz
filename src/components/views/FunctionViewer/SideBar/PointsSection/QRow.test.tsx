import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { act, render, toElement, updateLocationHash } from "#test"

import { planeSizeAtom } from "../../../CartesianPlane/state"
import { qXAtom } from "../../state"
import { QRow } from "./QRow"

beforeEach(() => {
  getDefaultStore().set(planeSizeAtom, { width: 500, height: 400 })
})

afterEach(async () => {
  const store = getDefaultStore()
  store.set(planeSizeAtom, { width: 0, height: 0 })
  store.set(qXAtom, null)
  await updateLocationHash("")
})

const renderRow = async (hash = "") => {
  await updateLocationHash(hash)
  const screen = await render(<QRow />)
  return toElement(screen.getByText("Q")).parentElement as HTMLElement
}

describe("Q's row", () => {
  it("asks for the pointer and shows dashes while the pointer is off the plane", async () => {
    const row = await renderRow()
    expect(row.textContent).toContain("point at the plane")
    expect(row.textContent).toContain("f(–) = –")
  })

  it("reads f(Q) through the picked function and transform while the pointer is on the plane", async () => {
    const row = await renderRow("#?func=x2&k=-1")
    act(() => getDefaultStore().set(qXAtom, 1.5))
    expect(row.textContent).toContain("follows your pointer")
    expect(row.textContent).toContain("f(1.50) = 1.25")
  })

  it("says ≈ when two decimals round f(Q)", async () => {
    const row = await renderRow("#?func=sinx")
    act(() => getDefaultStore().set(qXAtom, 1))
    expect(row.textContent).toContain("≈ 0.84")
  })

  it("goes back to dashes once the pointer leaves the plane", async () => {
    const row = await renderRow()
    act(() => getDefaultStore().set(qXAtom, 2))
    act(() => getDefaultStore().set(qXAtom, null))
    expect(row.textContent).toContain("point at the plane")
    expect(row.textContent).toContain("f(–) = –")
  })
})
