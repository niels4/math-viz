import { getDefaultStore } from "jotai"
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { FV_TOUR_KEY, fvTourDoneAtom } from "#src/state/fvTour.ts"
import { act, render, toElement } from "#test"

import type { PlaneScene } from "../CartesianPlane/scene.ts"

import { drawCartesianPlane } from "../CartesianPlane/drawCartesianPlane"
import { FunctionViewer } from "./FunctionViewer.tsx"
import { DOCK_QUERY } from "./layout.ts"

vi.mock("../CartesianPlane/drawCartesianPlane", () => ({
  drawCartesianPlane: vi.fn<(props: { scene: PlaneScene }) => void>(),
}))

const drawMock = drawCartesianPlane as unknown as Mock
const lastDraw = () => drawMock.mock.calls.at(-1)?.[0] as { scene: PlaneScene }
const lastScene = () => lastDraw().scene
/** The transformed curve, whatever the scene paints before it (the ghost original). */
const curveF = () => lastScene().curves.find((c) => c.id === "f")
const pointOf = (id: string) => lastScene().points.find((p) => p.id === id)

// Every context call is a no-op; text measures 0 px wide.
const stubCtx = new Proxy(
  {},
  { get: (_, key) => (key === "measureText" ? () => ({ width: 0 }) : () => {}), set: () => true },
)

const setInput = (input: HTMLInputElement, next: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  if (setter === undefined) {
    throw new Error("no native value setter")
  }
  setter.call(input, next)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

type Screen = Awaited<ReturnType<typeof render>>

const byTestId = (screen: Screen, id: string) => toElement(screen.getByTestId(id))

const keydown = (el: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init }))
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

// A plain click event: the clicked button can unmount during its own click,
// which jsdom's patched click() (src/test/jsdom-setup.ts) throws on.
const click = (screen: Screen, id: string) => {
  act(() => {
    byTestId(screen, id).dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

const valueOf = (screen: Screen, param: string) =>
  byTestId(screen, `fv-param-${param}-ruler`).getAttribute("aria-valuetext")

const typeInto = (screen: Screen, id: string, text: string) => {
  const field = byTestId(screen, id) as HTMLInputElement
  act(() => {
    field.focus()
    setInput(field, text)
  })
  keydown(field, "Enter")
}

/** A readout as it reads: a typed x (P's field) by its value. */
const readout = (screen: Screen, id: string) =>
  [...byTestId(screen, id).children]
    .map((part) => part.querySelector("input")?.value ?? part.textContent)
    .join("")

/** Text as read aloud: the no-break spaces that keep a "·" with its word read as spaces. */
const spoken = (el: Element) => el.textContent.replaceAll("\u00a0", " ")

const hint = (screen: Screen) => spoken(byTestId(screen, "fv-hint"))

const IDLE = "Drag a ruler sideways to reshape the curve · point at the plane to read f(x)"

/** A browser's matchMedia that prefers motion: no query matches. */
const FULL_MOTION = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList

const ZERO_RECT = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  toJSON: () => ({}),
} as DOMRect

const PLANE_RECT = {
  x: 0,
  y: 0,
  width: 600,
  height: 600,
  top: 0,
  left: 0,
  right: 600,
  bottom: 600,
  toJSON: () => ({}),
} as DOMRect

describe("FunctionViewer", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    // These tests are about the page's states, not its motion (motion/
    // fvMotion.test.ts): no matchMedia, no motion, in the browser project too.
    vi.stubGlobal("matchMedia", undefined)
    // These tests are about the page, not its first-minute tour.
    getDefaultStore().set(fvTourDoneAtom, true)
    drawMock.mockClear()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
  })

  it("draws its first paint on the plane when the page moves (FV 05 › Draw-on timeline)", async () => {
    vi.stubGlobal("matchMedia", FULL_MOTION)
    await render(<FunctionViewer />)
    // The first frame: the grid about to fade in, no curve drawn yet, P not in.
    expect(lastScene().gridAlpha).toBeLessThan(0.01)
    expect(curveF()?.drawTo).toBeLessThan(0.01)
    expect(pointOf("p")?.alpha).toBe(0)
  })

  it("prints R3's equation and plots its curve, vertex at (−1, 1) (D1)", async () => {
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "a", "2")
    typeParam(screen, "h", "-1")
    typeParam(screen, "k", "1")
    expect(toElement(screen.getByTestId("func-readout")).getAttribute("aria-label")).toBe(
      "f(x) = 2.00(x + 1.00)² + 1.00",
    )
    const curve = curveF()
    expect(curve?.fn(-1)).toBe(1)
    expect(curve?.fn(0.5)).toBe(5.5)
    // The form line keeps every letter; only b, still at its default, is a ghost slot (D13).
    const form = toElement(screen.getByTestId("fv-form"))
    expect(form.textContent).toContain("Form: f(x) = a((x − h)/b)² + k")
    expect([...form.querySelectorAll("[data-ghost]")].map((el) => el.getAttribute("data-param"))).toEqual([
      "b",
    ])
  })

  it("switches the function from the picker: equation and curve (D5)", async () => {
    const screen = await render(<FunctionViewer />)
    act(() => {
      toElement(screen.getByTestId("fv-fn-sin")).click()
    })
    expect(toElement(screen.getByTestId("fv-fn-sin")).getAttribute("aria-checked")).toBe("true")
    expect(toElement(screen.getByTestId("func-readout")).getAttribute("aria-label")).toBe("f(x) = sin(x)")
    expect(curveF()?.fn(Math.PI / 2)).toBe(1)
  })

  it("names the view and the live theme in its top bar", async () => {
    const screen = await render(<FunctionViewer />)
    expect(document.querySelector("header h1")?.textContent).toBe("Function Viewer")
    expect(document.querySelector("header h1 + p")?.textContent).toBe("Functions · transformations")
    const chip = () => toElement(screen.getByTestId("theme-chip")).textContent
    expect(chip()).toBe("Theme: Arctic Ice")
    // A plain click event: the menu closes on it, and jsdom's patched click() (src/test/jsdom-setup.ts)
    // throws on an element that unmounts during its own click.
    const click = (id: string) => {
      act(() => {
        toElement(screen.getByTestId(id)).dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
    }
    const pick = (slug: string) => {
      click("settings-button")
      click(`settings-theme-${slug}`)
    }
    pick("clean-teal")
    expect(chip()).toBe("Theme: Clean Teal")
    pick("arctic-ice")
    expect(chip()).toBe("Theme: Arctic Ice")
  })

  it("lays section 2 out as the equation: outside f( ) a, k; inside f( ) b, h", async () => {
    const screen = await render(<FunctionViewer />)
    const groups = [...document.querySelectorAll('[role="group"][aria-label]')].map((group) => ({
      name: group.getAttribute("aria-label"),
      params: [...group.querySelectorAll('[role="spinbutton"]')].map((el) => el.getAttribute("aria-label")),
    }))
    // Named as said aloud, without f's empty parentheses.
    expect(groups).toEqual([
      { name: "Vertical, outside f", params: ["a: Vertical scale", "k: Vertical shift"] },
      { name: "Horizontal, inside f", params: ["b: Horizontal scale", "h: Horizontal shift"] },
    ])
    // At the defaults: no ↺ and no Reset all, the flip toggles off (R2).
    expect(document.querySelector('[data-testid$="-reset"]')).toBeNull()
    expect(document.querySelector('[data-testid="fv-reset-all"]')).toBeNull()
    expect(byTestId(screen, "fv-param-a-flip").getAttribute("aria-pressed")).toBe("false")
    expect((byTestId(screen, "fv-param-b-field") as HTMLInputElement).value).toBe("1.00")
  })

  it("flips a scale, resets one and resets all (R8, FV 07 › Reset)", async () => {
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "a", "2")
    typeParam(screen, "k", "4")
    typeParam(screen, "h", "-1")
    click(screen, "fv-param-a-flip")
    expect(byTestId(screen, "fv-param-a-flip").getAttribute("aria-pressed")).toBe("true")
    expect(valueOf(screen, "a")).toBe("−2.00")
    expect(byTestId(screen, "func-readout").getAttribute("aria-label")).toBe("f(x) = −2.00(x + 1.00)² + 4.00")
    expect(curveF()?.fn(0.5)).toBe(-0.5)
    click(screen, "fv-param-k-reset")
    expect(valueOf(screen, "k")).toBe("0.00")
    expect(document.querySelector('[data-testid="fv-param-k-reset"]')).toBeNull()
    click(screen, "fv-reset-all")
    expect(["a", "b", "h", "k"].map((param) => valueOf(screen, param))).toEqual([
      "1.00",
      "1.00",
      "0.00",
      "0.00",
    ])
    expect(document.querySelector('[data-testid="fv-reset-all"]')).toBeNull()
  })

  it("refuses a typed scale of 0 and keeps the field open (FV 07)", async () => {
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "b", "0")
    const field = byTestId(screen, "fv-param-b-field") as HTMLInputElement
    expect(field.getAttribute("aria-invalid")).toBe("true")
    expect(field.value).toBe("0")
    expect(valueOf(screen, "b")).toBe("1.00")
    expect(byTestId(screen, "fv-param-b").hasAttribute("data-error")).toBe(true)
    keydown(field, "Escape")
    expect(field.value).toBe("1.00")
    expect(byTestId(screen, "fv-param-b").hasAttribute("data-error")).toBe(false)
  })

  it("works from the keyboard: arrows nudge, Enter types and hands the focus back, Backspace resets", async () => {
    const screen = await render(<FunctionViewer />)
    const ruler = byTestId(screen, "fv-param-k-ruler")
    act(() => {
      ruler.focus()
    })
    keydown(ruler, "ArrowRight")
    keydown(ruler, "ArrowRight", { shiftKey: true })
    expect(valueOf(screen, "k")).toBe("0.11")
    keydown(ruler, "Enter")
    const field = byTestId(screen, "fv-param-k-field") as HTMLInputElement
    expect(document.activeElement).toBe(field)
    act(() => {
      setInput(field, "1.5")
    })
    keydown(field, "Enter")
    expect(valueOf(screen, "k")).toBe("1.50")
    expect(document.activeElement).toBe(ruler)
    keydown(ruler, "Backspace")
    expect(valueOf(screen, "k")).toBe("0.00")
  })

  it("starts P at x = 2 (D4): its card reads f(2.00) = 4.00", async () => {
    const screen = await render(<FunctionViewer />)
    expect((byTestId(screen, "fv-p-field") as HTMLInputElement).value).toBe("2.00")
    expect(readout(screen, "fv-p-readout")).toBe("f(2.00) = 4.00")
    expect(byTestId(screen, "fv-point-p").textContent).toContain("Pinned")
    expect(pointOf("p")).toMatchObject({
      id: "p",
      x: 2,
      y: 4,
      style: "bullseye",
      ink: "chartPoint1",
    })
  })

  it("reads R3 on P's card: transforms and a typed x (FV 01 › Numbers)", async () => {
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "a", "2")
    typeParam(screen, "h", "-1")
    typeParam(screen, "k", "1")
    typeInto(screen, "fv-p-field", "0.5")
    expect(readout(screen, "fv-p-readout")).toBe("f(0.50) = 5.50")
    expect(pointOf("p")).toMatchObject({ x: 0.5, y: 5.5 })
    // P lands on 0.12, and f(0.12) = 3.5088 prints rounded.
    typeInto(screen, "fv-p-field", "0.123")
    expect(readout(screen, "fv-p-readout")).toBe("f(0.12) ≈ 3.51")
  })

  it("shows Q's placeholders until the pointer is on the plane, at one height (R2, R3)", async () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(ZERO_RECT)
    // Real Chromium's ResizeObserver would report the laid-out plane over the mock.
    vi.stubGlobal("ResizeObserver", undefined)
    const screen = await render(<FunctionViewer />)
    const q = byTestId(screen, "fv-point-q")
    expect(readout(screen, "fv-q-readout")).toBe("f(–) = –")
    expect(spoken(q)).toContain("Point at the plane to place Q")
    const canvas = byTestId(screen, "cartesian-canvas")
    // A zero rect at 100 %: the origin at (0, 0), 50 px per unit.
    act(() => {
      canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: -75, clientY: -112.5 }))
    })
    expect(readout(screen, "fv-q-readout")).toBe("f(−1.50) = 2.25")
    expect(spoken(q)).toContain("x follows your pointer · y = f(x)")
    expect(hint(screen)).toBe("Q follows your pointer · drag to pan · scroll to zoom")
    // FV 05: the values fade in as the pointer enters, and again as it leaves.
    const fades = () => [...q.querySelectorAll("[data-fade]")].map((el) => el.getAttribute("data-fade"))
    expect(fades()).toEqual(["in", "in"])
    act(() => {
      canvas.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }))
    })
    expect(readout(screen, "fv-q-readout")).toBe("f(–) = –")
    expect(fades()).toEqual(["out", "out"])
    expect(hint(screen)).toBe(IDLE)
  })

  it("moves P from its scrubber: ← → 0.1, Shift 1, Enter types its x (FV 07)", async () => {
    const screen = await render(<FunctionViewer />)
    const scrubber = byTestId(screen, "fv-p-scrubber")
    act(() => {
      scrubber.focus()
    })
    expect(hint(screen)).toBe("Drag P along the curve · Left arrow Right arrow nudge 0.1")
    keydown(scrubber, "ArrowRight")
    keydown(scrubber, "ArrowRight", { shiftKey: true })
    expect(readout(screen, "fv-p-readout")).toBe("f(3.10) = 9.61")
    keydown(scrubber, "Enter")
    const field = byTestId(screen, "fv-p-field") as HTMLInputElement
    expect(document.activeElement).toBe(field)
    expect(hint(screen)).toBe("Enter apply · Esc cancel · Up arrow Down arrow nudge 0.01")
    act(() => {
      setInput(field, "-1.5")
    })
    keydown(field, "Enter")
    expect(readout(screen, "fv-p-readout")).toBe("f(−1.50) = 2.25")
    expect(document.activeElement).toBe(scrubber)
  })

  it("speaks in the hint about the control under the pointer, a drag, and refused text", async () => {
    HTMLDivElement.prototype.setPointerCapture = () => {}
    HTMLDivElement.prototype.releasePointerCapture = () => {}
    HTMLDivElement.prototype.hasPointerCapture = () => false
    const screen = await render(<FunctionViewer />)
    expect(hint(screen)).toBe(IDLE)
    const a = byTestId(screen, "fv-param-a")
    act(() => {
      a.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, relatedTarget: document.body }))
    })
    expect(hint(screen)).toBe("Drag to change a · Shift fine · Ctrl quarter steps · double-click: back to 1")
    act(() => {
      a.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }))
    })
    expect(hint(screen)).toBe(IDLE)
    // R5: holding k's ruler.
    const ruler = byTestId(screen, "fv-param-k-ruler")
    act(() => {
      ruler.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, buttons: 1, clientX: 10 }),
      )
    })
    expect(hint(screen)).toBe("Drag to change k · Shift fine · Ctrl whole steps · double-click: back to 0")
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"))
    })
    typeParam(screen, "b", "1.0.4")
    expect(hint(screen)).toBe("Type a number such as 1.5 · Esc puts back 1.00")
    expect(byTestId(screen, "fv-hint").getAttribute("data-tone")).toBe("error")
  })
  it("shows the Original toggle while a transform is set, and the ghost while it is on (D7)", async () => {
    const screen = await render(<FunctionViewer />)
    expect(document.querySelector('[data-testid="fv-ghost-toggle"]')).toBeNull()
    typeParam(screen, "a", "2")
    const toggle = byTestId(screen, "fv-ghost-toggle")
    expect(toggle.getAttribute("aria-pressed")).toBe("true")
    expect(toggle.getAttribute("aria-label")).toBe("Original, y = x squared")
    expect(toggle.textContent).toContain("y = x²")
    expect(lastScene().curves.map((c) => c.id)).toEqual(["original", "f"])
    click(screen, "fv-ghost-toggle")
    expect(toggle.getAttribute("aria-pressed")).toBe("false")
    expect(lastScene().curves.map((c) => c.id)).toEqual(["f"])
    click(screen, "fv-ghost-toggle")
    expect(lastScene().curves.map((c) => c.id)).toEqual(["original", "f"])
    click(screen, "fv-reset-all")
    expect(document.querySelector('[data-testid="fv-ghost-toggle"]')).toBeNull()
  })

  it("lights P on the plane while its card is hovered: halo, drop lines, tags (FV 04 › Y1)", async () => {
    const screen = await render(<FunctionViewer />)
    expect(pointOf("p")).toMatchObject({ focus: false, axisTags: false })
    const card = byTestId(screen, "fv-point-p")
    act(() => {
      card.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, relatedTarget: document.body }))
    })
    expect(pointOf("p")).toMatchObject({ focus: true, axisTags: true })
    act(() => {
      card.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }))
    })
    expect(pointOf("p")).toMatchObject({ focus: false, axisTags: false })
  })

  it("moves P along the curve with [ and ] on the plane (FV 07)", async () => {
    const screen = await render(<FunctionViewer />)
    const plane = byTestId(screen, "cartesian-plane")
    expect(plane.getAttribute("aria-label")).toContain("[ and ] move P")
    keydown(plane, "]")
    expect(readout(screen, "fv-p-readout")).toBe("f(2.10) = 4.41")
    keydown(plane, "[")
    keydown(plane, "[")
    expect(readout(screen, "fv-p-readout")).toBe("f(1.90) = 3.61")
    expect(pointOf("p")).toMatchObject({ x: 1.9, y: 3.61 })
  })

  it("links a term and its control both ways: plates, chip, tip, hint, plane (FV 02 › H3, FV 04)", async () => {
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "a", "2")
    typeParam(screen, "h", "-1")
    typeParam(screen, "k", "1")
    act(() => {
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    const liveK = document.querySelector('[data-line="live"] [data-param="k"]')
    if (liveK === null) {
      throw new Error("no live k term")
    }
    act(() => {
      liveK.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }))
    })
    const lit = () =>
      [...document.querySelectorAll("[data-lit]")].map(
        (el) => el.getAttribute("data-param") ?? el.getAttribute("data-testid"),
      )
    // k's term in both lines and k's control light; the tip names the value the term means.
    expect(lit()).toEqual(["k", "k", "fv-param-k"])
    expect(spoken(byTestId(screen, "fv-term-tip-k"))).toBe("k= 1.00· vertical shift")
    expect(hint(screen)).toBe("Drag to change k · Shift fine · Ctrl whole steps · double-click: back to 0")
    expect(lastScene().annotations?.[0]?.lines[0]).toMatchObject({
      from: { x: -1, y: 0 },
      to: { x: -1, y: 1 },
    })
    act(() => {
      byTestId(screen, "fv-equation").dispatchEvent(
        new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }),
      )
    })
    expect(lit()).toEqual([])
    expect(document.querySelector('[data-testid="fv-term-tip-k"]')).toBeNull()
    expect(lastScene().annotations).toEqual([])
    // And back: the h control under the pointer lights h's terms.
    act(() => {
      byTestId(screen, "fv-param-h").dispatchEvent(
        new PointerEvent("pointerover", { bubbles: true, relatedTarget: document.body }),
      )
    })
    expect(lit()).toEqual(["h", "h", "fv-param-h"])
  })

  it("drags a term like its ruler, keeps it in the live line, and resets it on a double-click (D13)", async () => {
    HTMLSpanElement.prototype.setPointerCapture = () => {}
    HTMLSpanElement.prototype.releasePointerCapture = () => {}
    HTMLSpanElement.prototype.hasPointerCapture = () => false
    const screen = await render(<FunctionViewer />)
    const formK = document.querySelector('[data-line="form"] [data-param="k"]')
    if (formK === null) {
      throw new Error("no form k slot")
    }
    const at = (type: string, clientX: number, buttons: number) =>
      act(() => {
        formK.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, buttons, clientX }))
      })
    at("pointerdown", 10, 1)
    at("pointermove", 60, 1)
    // 50 px right is one unit for a shift, as on its ruler; k's ruler shows the drag.
    expect(valueOf(screen, "k")).toBe("1.00")
    expect(byTestId(screen, "fv-param-k-ruler").getAttribute("data-mode")).toBe("coarse")
    at("pointermove", 10, 1)
    // Back at 0 mid-drag, the live line keeps the term: "+ 0.00".
    expect(document.querySelector('[data-line="live"] [data-param="k"]')?.textContent).toBe("+ 0.00")
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"))
    })
    expect(document.querySelector('[data-line="live"] [data-param="k"]')).toBeNull()
    expect(byTestId(screen, "fv-param-k-ruler").getAttribute("data-mode")).toBeNull()
    at("pointerdown", 10, 1)
    at("pointermove", 35, 1)
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"))
      formK.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
    })
    expect(valueOf(screen, "k")).toBe("0.00")
  })

  // The user's ruling (plan M10b): fixed decimals, 3 for a fine drag's
  // whole length, wherever the value prints.
  it("holds 3 decimals for a fine drag's whole length, in the field, the term and the plate", async () => {
    HTMLSpanElement.prototype.setPointerCapture = () => {}
    HTMLSpanElement.prototype.releasePointerCapture = () => {}
    HTMLSpanElement.prototype.hasPointerCapture = () => false
    const screen = await render(<FunctionViewer />)
    const formK = document.querySelector('[data-line="form"] [data-param="k"]')
    if (formK === null) {
      throw new Error("no form k slot")
    }
    const at = (type: string, clientX: number, shiftKey: boolean) =>
      act(() => {
        formK.dispatchEvent(
          new PointerEvent(type, { bubbles: true, button: 0, buttons: 1, clientX, shiftKey }),
        )
      })
    const field = () => (byTestId(screen, "fv-param-k-field") as HTMLInputElement).value
    const term = () => document.querySelector('[data-line="live"] [data-param="k"]')?.textContent
    const plate = () => lastScene().annotations?.[0]?.plates[0]?.runs[1]?.text
    at("pointerdown", 10, true)
    expect([field(), valueOf(screen, "k"), term()]).toEqual(["0.000", "0.000", "+ 0.000"])
    // Fine: 50 px is a tenth of a unit.
    at("pointermove", 60, true)
    expect([field(), valueOf(screen, "k"), term(), plate()]).toEqual(["0.100", "0.100", "+ 0.100", "= 0.100"])
    // Shift let go mid-drag: coarse again, still 3 decimals.
    at("pointermove", 110, false)
    expect([field(), term(), plate()]).toEqual(["1.100", "+ 1.100", "= 1.100"])
    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup"))
    })
    expect([field(), valueOf(screen, "k")]).toEqual(["1.10", "1.10"])
  })

  it("keeps each readout number in a slot as wide as the plane's view prints it", async () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return this.closest('[data-testid="cartesian-plane"]') !== null &&
        this.closest("[data-keep-out]") === null
        ? PLANE_RECT
        : ZERO_RECT
    })
    vi.stubGlobal("ResizeObserver", undefined)
    const screen = await render(<FunctionViewer />)
    // 600 × 600 at 50 px per unit: x and y run −6 … 6, "−6.00" the widest.
    // Each run's box in characters: x's spare room before "f(" fills x's
    // slot (--slot, less x's own --chars); y sits in its slot after "=".
    const boxes = (id: string) =>
      [...byTestId(screen, id).children].flatMap((part) => {
        const css = (part as HTMLElement).style
        const [slot, chars] = [css.getPropertyValue("--slot"), css.getPropertyValue("--chars")]
        return chars === "" ? [] : [slot === "" ? Number(chars) : `${slot} − ${chars}`]
      })
    expect(readout(screen, "fv-p-readout")).toBe("f(2.00) = 4.00")
    expect(boxes("fv-p-readout")).toEqual(["5 − 4", 4, 5])
    // Q with no point keeps its dashes' own width.
    expect(boxes("fv-q-readout")).toEqual([1, 1])
  })

  it("drags the anchor on the plane: h and k follow, P's ghost and badge show, then go (R6, FV 04)", async () => {
    HTMLCanvasElement.prototype.setPointerCapture = () => {}
    HTMLCanvasElement.prototype.releasePointerCapture = () => {}
    HTMLCanvasElement.prototype.hasPointerCapture = () => false
    // A 600 × 600 plane at the page's top-left: 50 px per unit, the origin at (300, 300).
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return this.closest('[data-testid="cartesian-plane"]') !== null &&
        this.closest("[data-keep-out]") === null
        ? PLANE_RECT
        : ZERO_RECT
    })
    vi.stubGlobal("ResizeObserver", undefined)
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "a", "2")
    typeParam(screen, "h", "-1")
    typeParam(screen, "k", "1")
    typeInto(screen, "fv-p-field", "0.5")
    act(() => {
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    const canvas = byTestId(screen, "cartesian-canvas")
    const toScreen = (x: number, y: number) => {
      const zoom = Number(canvas.dataset["zoom"])
      return {
        clientX: Number(canvas.dataset["originX"]) + x * zoom,
        clientY: Number(canvas.dataset["originY"]) - y * zoom,
      }
    }
    expect(canvas.dataset["handles"]).toBe("anchor stretch")
    const at = (type: string, x: number, y: number, buttons: number) =>
      act(() => {
        canvas.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerId: 1,
            isPrimary: true,
            button: 0,
            buttons,
            ...toScreen(x, y),
          }),
        )
      })
    // The pointer on the anchor (−1, 1): grab, both its values lit, the handles' hint.
    at("pointermove", -1, 1, 0)
    expect(canvas.dataset["cursor"]).toBe("grab")
    expect(hint(screen)).toBe("Drag the diamond to move the curve · the square to stretch it")
    expect(byTestId(screen, "fv-param-h").hasAttribute("data-lit")).toBe(true)
    expect(byTestId(screen, "fv-param-k").hasAttribute("data-lit")).toBe(true)
    at("pointerdown", -1, 1, 1)
    at("pointermove", 1.5, 1, 1)
    expect([valueOf(screen, "h"), valueOf(screen, "k")]).toEqual(["1.50", "1.00"])
    expect(hint(screen)).toBe("Moving the anchor sets h and k · Shift locks one axis")
    expect(lastScene().handles?.[0]).toMatchObject({ x: 1.5, y: 1, held: true, halo: true })
    // P keeps its x (D15): f(0.50) went from 5.50 to 3.00.
    expect(readout(screen, "fv-p-readout")).toBe("f(0.50) = 3.00")
    expect(spoken(byTestId(screen, "fv-p-moved"))).toBe("moved−2.50")
    expect(pointOf("p")?.was).toEqual({ x: 0.5, y: 5.5, ink: "primary" })
    // Let go: both stay 600 ms, then go (FV 04 › Rules).
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    at("pointerup", 1.5, 1, 0)
    const badge = () => document.querySelector('[data-testid="fv-p-moved"]')
    act(() => {
      vi.advanceTimersByTime(599)
    })
    expect(badge()).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(badge()).toBeNull()
    expect(pointOf("p")?.was).toBeUndefined()
  })

  describe("explainers (D10, D12; R7)", () => {
    const explainer = (param: string) => document.querySelector(`[data-testid="fv-explainer-${param}"]`)
    const pointer = (el: Element, type: string, pointerType: string) =>
      act(() => {
        el.dispatchEvent(new PointerEvent(type, { bubbles: true, relatedTarget: document.body, pointerType }))
      })

    it("opens after the pointer rests 400 ms on a letter chip, lights its value, and closes as it leaves", async () => {
      const screen = await render(<FunctionViewer />)
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
      const chip = byTestId(screen, "fv-param-a-chip")
      pointer(chip, "pointerover", "mouse")
      act(() => {
        vi.advanceTimersByTime(399)
      })
      expect(explainer("a")).toBeNull()
      act(() => {
        vi.advanceTimersByTime(1)
      })
      const open = explainer("a")
      expect(open?.getAttribute("role")).toBe("dialog")
      expect(open?.textContent).toContain("Vertical scale")
      expect(open?.textContent).toContain("Multiplies every height by a.")
      // Its letter lit in the snippet and in both equation lines, its control too (R7).
      expect(open?.querySelector("[data-lit]")?.textContent).toBe("a")
      expect(
        [...byTestId(screen, "fv-form").querySelectorAll("[data-lit]")].map((t) => t.textContent),
      ).toEqual(["a"])
      expect(byTestId(screen, "fv-param-a").hasAttribute("data-lit")).toBe(true)
      expect(hint(screen)).toBe(
        "Drag to change a · Shift fine · Ctrl quarter steps · double-click: back to 1",
      )
      pointer(chip, "pointerout", "mouse")
      expect(explainer("a")).toBeNull()
    })

    it("opens the focused control's with ?, describes its ruler, and closes on Esc or as the focus leaves", async () => {
      const screen = await render(<FunctionViewer />)
      const ruler = byTestId(screen, "fv-param-k-ruler")
      act(() => {
        ruler.focus()
      })
      keydown(ruler, "?")
      const sentence = explainer("k")?.querySelector("p")
      expect(sentence?.textContent).toBe(
        "Adds k to every height, so the whole curve moves up by k (down when k is negative).",
      )
      expect(ruler.getAttribute("aria-describedby")).toBe(sentence?.id)
      keydown(ruler, "Escape")
      expect(explainer("k")).toBeNull()
      expect(ruler.hasAttribute("aria-describedby")).toBe(false)
      keydown(ruler, "?")
      expect(explainer("k")).not.toBeNull()
      act(() => {
        ruler.blur()
      })
      expect(explainer("k")).toBeNull()
    })

    it("leaves on the overlays' motion: on screen and inert for 120 ms, then gone", async () => {
      vi.stubGlobal("matchMedia", FULL_MOTION)
      const screen = await render(<FunctionViewer />)
      const ruler = byTestId(screen, "fv-param-k-ruler")
      act(() => {
        ruler.focus()
      })
      keydown(ruler, "?")
      expect(explainer("k")?.hasAttribute("data-closing")).toBe(false)
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
      keydown(ruler, "Escape")
      const leaving = explainer("k")
      expect(leaving?.hasAttribute("data-closing")).toBe(true)
      expect(leaving?.hasAttribute("inert")).toBe(true)
      // Closed for the page at once: the ruler no longer points at it.
      expect(ruler.hasAttribute("aria-describedby")).toBe(false)
      act(() => {
        vi.advanceTimersByTime(120)
      })
      expect(explainer("k")).toBeNull()
    })

    it("toggles with a tap on the chip; a press anywhere else closes it", async () => {
      const screen = await render(<FunctionViewer />)
      const chip = byTestId(screen, "fv-param-h-chip")
      const tap = () => {
        pointer(chip, "pointerdown", "touch")
        act(() => {
          chip.dispatchEvent(new MouseEvent("click", { bubbles: true }))
        })
      }
      tap()
      expect(explainer("h")?.textContent).toContain("Horizontal shift")
      tap()
      expect(explainer("h")).toBeNull()
      tap()
      pointer(document.body, "pointerdown", "touch")
      expect(explainer("h")).toBeNull()
    })
  })

  describe("the dock (D16, D18; R9)", () => {
    // A window whose height matches the dock's query while `short` is set.
    const window = (short: boolean) => {
      let matching = short
      const listeners = new Set<() => void>()
      vi.stubGlobal("matchMedia", (query: string) => ({
        media: query,
        get matches() {
          return query === DOCK_QUERY && matching
        },
        addEventListener: (_: string, listener: () => void) => {
          listeners.add(listener)
        },
        removeEventListener: (_: string, listener: () => void) => {
          listeners.delete(listener)
        },
      }))
      return (next: boolean) => {
        matching = next
        act(() => {
          for (const listener of listeners) {
            listener()
          }
        })
      }
    }
    const layout = () => document.querySelector("[data-layout]")?.getAttribute("data-layout")

    it("docks the panel under the plane: the hint under the equation, the form line read aloud only", async () => {
      window(true)
      const screen = await render(<FunctionViewer />)
      expect(layout()).toBe("dock")
      // D18: the hint shares section 1 with the picker and the equation.
      const section1 = byTestId(screen, "fv-hint").closest("section")
      expect(section1?.querySelector('[role="radiogroup"]')).not.toBeNull()
      expect(section1?.contains(byTestId(screen, "fv-equation"))).toBe(true)
      expect(hint(screen)).toBe(IDLE)
      expect(document.querySelector('[data-line="form"]')).toBeNull()
      expect(spoken(byTestId(screen, "fv-form"))).toBe("Form: f(x) = a((x − h)/b)² + k")
      // The groups keep their names for screen readers.
      const names = [...document.querySelectorAll('[role="group"][aria-label]')].map((group) =>
        group.getAttribute("aria-label"),
      )
      expect(names).toEqual(["Vertical, outside f", "Horizontal, inside f"])
    })

    it("compacts the point cards: Q's shorter role and notes, no note on P's (R9)", async () => {
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(ZERO_RECT)
      vi.stubGlobal("ResizeObserver", undefined)
      window(true)
      const screen = await render(<FunctionViewer />)
      const p = byTestId(screen, "fv-point-p")
      const q = byTestId(screen, "fv-point-q")
      expect(spoken(p)).toContain("Pinned")
      expect(spoken(p)).not.toContain("here or along the curve")
      expect(readout(screen, "fv-p-readout")).toBe("f(2.00) = 4.00")
      expect(spoken(q)).toContain("Pointer")
      expect(spoken(q)).toContain("Point at the plane")
      expect(spoken(q)).not.toContain("to place")
      const canvas = byTestId(screen, "cartesian-canvas")
      act(() => {
        canvas.dispatchEvent(
          new PointerEvent("pointermove", { bubbles: true, clientX: -75, clientY: -112.5 }),
        )
      })
      expect(readout(screen, "fv-q-readout")).toBe("f(−1.50) = 2.25")
      expect(spoken(q)).toContain("x follows your pointer")
      expect(spoken(q)).not.toContain("y = f(x)")
    })

    it("switches as the window's height crosses 860 px, keeping the plane and every value", async () => {
      const setShort = window(false)
      const screen = await render(<FunctionViewer />)
      expect(layout()).toBe("side")
      typeParam(screen, "a", "2")
      const canvas = byTestId(screen, "cartesian-canvas")
      setShort(true)
      expect(layout()).toBe("dock")
      expect(byTestId(screen, "cartesian-canvas")).toBe(canvas)
      expect(valueOf(screen, "a")).toBe("2.00")
      expect(byTestId(screen, "func-readout").getAttribute("aria-label")).toBe("f(x) = 2.00x²")
      setShort(false)
      expect(layout()).toBe("side")
      expect(byTestId(screen, "cartesian-canvas")).toBe(canvas)
      expect(document.querySelector('[data-line="form"]')).not.toBeNull()
    })
  })

  describe("the tour (D19, FV 08; R1)", () => {
    const card = () => document.querySelector<HTMLElement>('[data-testid="fv-tour"]')
    const title = () => card()?.querySelector("h2")?.textContent ?? null
    const firstVisit = () => {
      getDefaultStore().set(fvTourDoneAtom, false)
      return render(<FunctionViewer />)
    }

    it("waits for the first paint's draw-on when the page moves (FV 08 › Flow)", async () => {
      vi.stubGlobal("matchMedia", FULL_MOTION)
      await firstVisit()
      expect(card()).toBeNull()
    })

    it("runs on a first visit: step 1 about the curve and P, Next on, Skip remembered", async () => {
      const screen = await firstVisit()
      expect(card()?.getAttribute("role")).toBe("dialog")
      expect(title()).toBe("This is a function")
      expect(spoken(card()?.querySelector("p") ?? document.body)).toBe(
        "f(x) = x² turns every x into a height. The curve is all the points (x, f(x)) — P is one of them: f(2.00) = 4.00.",
      )
      expect(card()?.textContent).toContain("Step 1 of 3")
      // Nothing else had the focus: the dialog takes it, then each step's button.
      expect(document.activeElement).toBe(card())
      click(screen, "fv-tour-next")
      expect(title()).toBe("Change it by dragging")
      expect(document.activeElement).toBe(byTestId(screen, "fv-tour-next"))
      expect(document.querySelector('[data-testid="fv-tour-hand"]')).not.toBeNull()
      click(screen, "fv-tour-skip")
      expect(card()).toBeNull()
      expect(localStorage.getItem(FV_TOUR_KEY)).toBe("true")
    })

    it("doesn't run once remembered, and runs again from the settings menu", async () => {
      const screen = await render(<FunctionViewer />)
      expect(card()).toBeNull()
      click(screen, "settings-button")
      click(screen, "settings-action-tour")
      expect(title()).toBe("This is a function")
    })

    it("leaves on the overlays' motion: the card and the scrim stay 120 ms, inert, then go", async () => {
      vi.stubGlobal("matchMedia", FULL_MOTION)
      const screen = await render(<FunctionViewer />)
      click(screen, "settings-button")
      click(screen, "settings-action-tour")
      expect(title()).toBe("This is a function")
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
      click(screen, "fv-tour-skip")
      expect(card()?.hasAttribute("data-closing")).toBe(true)
      expect(card()?.hasAttribute("inert")).toBe(true)
      expect(document.querySelector('[data-testid="fv-tour-scrim"]')?.hasAttribute("data-closing")).toBe(true)
      expect(localStorage.getItem(FV_TOUR_KEY)).toBe("true")
      act(() => {
        vi.advanceTimersByTime(120)
      })
      expect(card()).toBeNull()
      expect(document.querySelector('[data-testid="fv-tour-scrim"]')).toBeNull()
    })

    it("moves on from step 1 after 6 s without input, and Esc skips it", async () => {
      await firstVisit()
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      // Any input starts the 6 s over.
      act(() => {
        document.body.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }))
        vi.advanceTimersByTime(5000)
      })
      expect(title()).toBe("This is a function")
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(title()).toBe("Change it by dragging")
      keydown(document.body, "Escape")
      expect(card()).toBeNull()
    })

    it("completes step 2 on a real ruler drag and step 3 once Q follows the pointer", async () => {
      HTMLDivElement.prototype.setPointerCapture = () => {}
      HTMLDivElement.prototype.releasePointerCapture = () => {}
      HTMLDivElement.prototype.hasPointerCapture = () => false
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(ZERO_RECT)
      vi.stubGlobal("ResizeObserver", undefined)
      const screen = await firstVisit()
      click(screen, "fv-tour-next")
      const ruler = byTestId(screen, "fv-param-k-ruler")
      const drag = (type: string, clientX: number, buttons: number) =>
        act(() => {
          ruler.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, buttons, clientX }))
        })
      drag("pointerdown", 10, 1)
      drag("pointermove", 60, 1)
      // Mid-drag the step waits for the release.
      expect(title()).toBe("Change it by dragging")
      act(() => {
        window.dispatchEvent(new PointerEvent("pointerup"))
      })
      expect(title()).toBe("Read it anywhere")
      expect(byTestId(screen, "fv-tour-next").textContent).toBe("Done")
      expect(document.querySelector('[data-testid="fv-tour-skip"]')).toBeNull()
      const canvas = byTestId(screen, "cartesian-canvas")
      const move = (clientX: number) =>
        act(() => {
          canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX, clientY: 0 }))
        })
      move(-75)
      expect(title()).toBe("Read it anywhere")
      move(-60)
      expect(card()).toBeNull()
      expect(localStorage.getItem(FV_TOUR_KEY)).toBe("true")
    })
  })
})
