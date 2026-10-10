import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fvTourDoneAtom } from "#src/state/fvTour.ts"
import { act, render, toElement } from "#test"

import type { PlaneScene } from "../../CartesianPlane/scene.ts"

import { FunctionViewer } from "../FunctionViewer.tsx"
import { C3_SIDEBAR } from "../sidebar.ts"

vi.mock("../../CartesianPlane/drawCartesianPlane", () => ({
  drawCartesianPlane: vi.fn<(props: { scene: PlaneScene }) => void>(),
}))

// Every context call is a no-op; text measures 0 px wide.
const stubCtx = new Proxy(
  {},
  { get: (_, key) => (key === "measureText" ? () => ({ width: 0 }) : () => {}), set: () => true },
)

type Screen = Awaited<ReturnType<typeof render>>

const byTestId = (screen: Screen, id: string) => toElement(screen.getByTestId(id))

const renderV2 = () => render(<FunctionViewer sidebar={C3_SIDEBAR} />)

describe("the C3 sidebar (#demos/function-viewer-v2)", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    // The sidebar's states, not the motion or the tour.
    vi.stubGlobal("matchMedia", undefined)
    getDefaultStore().set(fvTourDoneAtom, true)
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
  })

  it("sets its three sections on sub cards, each named by its heading", async () => {
    const screen = await renderV2()
    const names = ["function", "transform", "points"].map((id) => {
      const card = byTestId(screen, `fv-section-${id}`)
      const heading = document.getElementById(card.getAttribute("aria-labelledby") ?? "")
      return heading?.textContent
    })
    expect(names).toEqual(["Function", "Transform", "Points"])
    // No hint bar: its words went to tips (B › Where things went).
    expect(document.querySelector('[data-testid="fv-hint"]')).toBeNull()
  })

  it("switches the function from the picker", async () => {
    const screen = await renderV2()
    act(() => {
      byTestId(screen, "fv-fn-sin").click()
    })
    expect(byTestId(screen, "fv-fn-sin").getAttribute("aria-checked")).toBe("true")
  })
})
