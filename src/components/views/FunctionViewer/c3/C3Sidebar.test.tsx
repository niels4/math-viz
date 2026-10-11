import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { FV_TOUR_KEY, fvTourDoneAtom } from "#src/state/fvTour.ts"
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

const setInput = (input: HTMLInputElement, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  setter?.call(input, next)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

const keydown = (el: HTMLElement, key: string) => {
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }))
  })
}

// As a person types a value: open the field, type, Enter.
const typeParam = (screen: Screen, param: string, text: string) => {
  const field = byTestId(screen, `fv-param-${param}-field`) as HTMLInputElement
  act(() => {
    field.focus()
    setInput(field, text)
  })
  keydown(field, "Enter")
}

const exists = (id: string) => document.querySelector(`[data-testid="${id}"]`) !== null

// Real Chromium throws on synthetic pointerIds.
const stubPointerCapture = () => {
  HTMLDivElement.prototype.setPointerCapture = () => {}
  HTMLDivElement.prototype.releasePointerCapture = () => {}
  HTMLDivElement.prototype.hasPointerCapture = () => false
}

const press = (el: HTMLElement, type: string, clientX: number, buttons: number) => {
  act(() => {
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, buttons, clientX }))
  })
}

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
    vi.useRealTimers()
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

  it("sets a, k | b, h as two named groups of rows, each row's box a spin button", async () => {
    await renderV2()
    const groups = [...document.querySelectorAll('[role="group"][aria-label]')].map((group) => ({
      name: group.getAttribute("aria-label"),
      boxes: [...group.querySelectorAll('[role="spinbutton"]')].map((el) => el.getAttribute("aria-label")),
    }))
    expect(groups).toEqual([
      { name: "Vertical, outside f", boxes: ["a: Vertical scale", "k: Vertical shift"] },
      { name: "Horizontal, inside f", boxes: ["b: Horizontal scale", "h: Horizontal shift"] },
    ])
  })

  it("shows the flip toggles at rest, and ↺ and Reset all once a value moves", async () => {
    const screen = await renderV2()
    expect(exists("fv-param-a-flip") && exists("fv-param-b-flip")).toBe(true)
    expect(exists("fv-param-k-flip") || exists("fv-param-h-flip")).toBe(false)
    expect(exists("fv-param-a-reset") || exists("fv-reset-all")).toBe(false)
    typeParam(screen, "a", "1.5")
    expect(exists("fv-param-a-reset") && exists("fv-reset-all")).toBe(true)
    expect(exists("fv-param-k-reset")).toBe(false)
  })

  it("prints the board's In use values in the boxes and the live equation", async () => {
    const screen = await renderV2()
    typeParam(screen, "a", "1.5")
    typeParam(screen, "h", "1")
    typeParam(screen, "k", "-1")
    expect(byTestId(screen, "func-readout").getAttribute("aria-label")).toBe("f(x) = 1.50(x − 1.00)² − 1.00")
    expect(byTestId(screen, "fv-param-k-box").getAttribute("aria-valuetext")).toBe("−1.00")
    // Each value's term carries its parameter, which its colour follows.
    const live = byTestId(screen, "fv-equation").querySelector('[data-line="live"]')
    expect(
      [...(live?.querySelectorAll("[data-param]") ?? [])].map((t) => t.getAttribute("data-param")),
    ).toEqual(["a", "h", "k"])
  })

  it("flips a with its toggle, pressed while a is negative", async () => {
    const screen = await renderV2()
    act(() => {
      byTestId(screen, "fv-param-a-flip").click()
    })
    expect(byTestId(screen, "fv-param-a-box").getAttribute("aria-valuetext")).toBe("−1.00")
    expect(byTestId(screen, "fv-param-a-flip").getAttribute("aria-pressed")).toBe("true")
  })

  it("lets ↺ step out of its row while the row is dragged, and bands the row", async () => {
    stubPointerCapture()
    const screen = await renderV2()
    typeParam(screen, "a", "1.5")
    const box = byTestId(screen, "fv-param-a-box")
    press(box, "pointerdown", 100, 1)
    press(box, "pointermove", 140, 1)
    expect(byTestId(screen, "fv-param-a").getAttribute("data-mode")).toBe("coarse")
    expect(exists("fv-param-a-reset")).toBe(false)
    press(box, "pointerup", 140, 0)
    expect(exists("fv-param-a-reset")).toBe(true)
  })

  it("puts every value back with Reset all, handing the keyboard's focus to a's box", async () => {
    const screen = await renderV2()
    typeParam(screen, "a", "2")
    typeParam(screen, "k", "1")
    const resetAll = byTestId(screen, "fv-reset-all")
    act(() => {
      resetAll.focus()
      resetAll.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(byTestId(screen, "func-readout").getAttribute("aria-label")).toBe("f(x) = x²")
    expect(exists("fv-reset-all")).toBe(false)
    expect(document.activeElement).toBe(byTestId(screen, "fv-param-a-box"))
  })

  it("shows the ruler under a row while its drag holds, and drops it on release", async () => {
    stubPointerCapture()
    const screen = await renderV2()
    const box = byTestId(screen, "fv-param-k-box")
    press(box, "pointerdown", 100, 1)
    expect(exists("fv-param-k-ruler")).toBe(false)
    press(box, "pointermove", 150, 1)
    const ruler = byTestId(screen, "fv-param-k-ruler")
    expect(ruler.getAttribute("aria-hidden")).toBeNull()
    expect(ruler.querySelector('[aria-hidden="true"][data-mode="coarse"]')).not.toBeNull()
    press(box, "pointerup", 150, 0)
    expect(exists("fv-param-k-ruler")).toBe(false)
  })

  describe("tips, where the hint bar spoke (SB · B)", () => {
    const tipOf = (param: string) => document.querySelector(`[data-testid="fv-param-${param}-tip"]`)
    const pointer = (el: Element, type: string) =>
      act(() => {
        el.dispatchEvent(
          new PointerEvent(type, { bubbles: true, relatedTarget: document.body, pointerType: "mouse" }),
        )
      })

    it("teaches a box's gestures in B's words once the pointer rests on it 400 ms", async () => {
      const screen = await renderV2()
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
      const box = byTestId(screen, "fv-param-a-box")
      pointer(box, "pointerover")
      act(() => {
        vi.advanceTimersByTime(399)
      })
      expect(tipOf("a")).toBeNull()
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(tipOf("a")?.textContent?.replaceAll("\u00a0", " ")).toBe(
        "Drag sideways · Shift for fine · double-click: back to 1",
      )
      pointer(box, "pointerout")
      expect(tipOf("a")).toBeNull()
    })

    it("names the typing keys while a value is typed, and why refused text is refused", async () => {
      const screen = await renderV2()
      const field = byTestId(screen, "fv-param-b-field") as HTMLInputElement
      act(() => {
        field.focus()
      })
      expect(tipOf("b")?.textContent).toContain("apply")
      act(() => setInput(field, "0"))
      keydown(field, "Enter")
      expect(tipOf("b")?.getAttribute("data-tone")).toBe("error")
      expect(tipOf("b")?.textContent).toContain("A scale of 0 squashes the curve flat.")
      // Esc hands the focus back to the box from the keyboard: its keys.
      keydown(field, "Escape")
      expect(tipOf("b")?.hasAttribute("data-tone")).toBe(false)
      expect(tipOf("b")?.textContent).toContain("nudge 0.01")
    })

    it("says today's hint to screen readers, in C3's words at rest", async () => {
      const screen = await renderV2()
      const spokenLine = byTestId(screen, "fv-hint-spoken")
      expect(spokenLine.getAttribute("role")).toBe("status")
      expect(spokenLine.textContent?.replaceAll("\u00a0", " ")).toBe(
        "Drag a number sideways to reshape the curve · point at the plane to read f(x)",
      )
      act(() => {
        byTestId(screen, "fv-param-k-box").focus()
      })
      expect(spokenLine.textContent?.replaceAll("\u00a0", " ")).toBe(
        "Drag to change k · Shift fine · Ctrl whole steps · double-click: back to 0",
      )
    })
  })

  it("has the tour's step 2 drag k's number, the hand on its box", async () => {
    getDefaultStore().set(fvTourDoneAtom, false)
    const screen = await renderV2()
    act(() => {
      byTestId(screen, "fv-tour-next").dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    const card = byTestId(screen, "fv-tour")
    expect(card.textContent).toContain("Change it by dragging")
    expect(card.textContent?.replaceAll("\u00a0", " ")).toContain(
      "Drag the k number sideways: the whole curve moves up or down by k. Every number works the same way.",
    )
    expect(exists("fv-tour-hand")).toBe(true)
    act(() => {
      byTestId(screen, "fv-tour-skip").dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(localStorage.getItem(FV_TOUR_KEY)).toBe("true")
  })

  it("has the explainer drag the number, its chip in the parameter's colour", async () => {
    const screen = await renderV2()
    const box = byTestId(screen, "fv-param-h-box")
    act(() => {
      box.focus()
    })
    keydown(box, "?")
    const explainer = byTestId(screen, "fv-explainer-h")
    expect(explainer.textContent).toContain("Drag the number")
    expect(explainer.className).toMatch(/explainer_h/)
  })
})
