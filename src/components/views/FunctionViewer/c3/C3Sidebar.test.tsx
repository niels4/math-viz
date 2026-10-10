import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fvTourDoneAtom } from "#src/state/fvTour.ts"
import arcticTheme from "#src/style/themes/mathviz_arctic_ice.module.css"
import { act, isBrowser, render, toElement } from "#test"

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

const renderV2 = () =>
  render(
    <div className={arcticTheme.theme}>
      <FunctionViewer sidebar={C3_SIDEBAR} />
    </div>,
  )

/** A colour as the browser resolves it, through a probe in the themed tree. */
const resolved = (css: string, within: Element) => {
  const probe = document.createElement("span")
  probe.style.color = css
  within.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

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

  it("prints the form line without its label, read aloud as Form: …", async () => {
    const screen = await renderV2()
    const form = byTestId(screen, "fv-form")
    expect(form.textContent).toContain("Form: f(x) = a((x − h)/b)² + k")
    // Only the screen readers' copy says "Form": no visible label.
    expect(form.children.length).toBe(2)
  })

  it("names P's role and Q's in plain words (SB3 · C3 › Points)", async () => {
    const screen = await renderV2()
    expect(byTestId(screen, "fv-point-p").textContent).toContain("pinned")
    expect(byTestId(screen, "fv-point-q").textContent).toContain("point at the plane")
    expect(byTestId(screen, "fv-p-scrubber").getAttribute("data-look")).toBe("line")
  })

  // jsdom resolves no custom properties: the browser checks the bindings.
  it.runIf(isBrowser())("colours each form letter by its parameter's token", async () => {
    const screen = await renderV2()
    const card = byTestId(screen, "fv-equation")
    for (const param of ["a", "h", "b", "k"]) {
      const term = card.querySelector(`[data-line="form"] [data-param="${param}"]`)
      expect(term).not.toBeNull()
      expect(getComputedStyle(term ?? card).color).toBe(resolved(`var(--param-${param})`, card))
    }
  })
})
