import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest"

import { act, render, toElement } from "#test"

import type { PlaneScene } from "../CartesianPlane/scene.ts"

import { drawCartesianPlane } from "../CartesianPlane/drawCartesianPlane"
import { FunctionViewer } from "./FunctionViewer.tsx"

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

describe("FunctionViewer", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    drawMock.mockClear()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      stubCtx as unknown as CanvasRenderingContext2D,
    )
  })

  it("prints R3's equation and plots its curve, vertex at (−1, 1) (D1)", async () => {
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "a", "2")
    typeParam(screen, "h", "-1")
    typeParam(screen, "k", "1")
    expect(toElement(screen.getByTestId("func-readout")).getAttribute("aria-label")).toBe(
      "f(x) = 2(x + 1)² + 1",
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
    const groups = [...document.querySelectorAll('[role="group"][aria-labelledby]')].map((group) => ({
      name: document.getElementById(group.getAttribute("aria-labelledby") ?? "")?.textContent,
      params: [...group.querySelectorAll('[role="slider"]')].map((el) => el.getAttribute("aria-label")),
    }))
    expect(groups).toEqual([
      { name: "Verticaloutsidef( )", params: ["a: Vertical scale", "k: Vertical shift"] },
      { name: "Horizontalinsidef( )", params: ["b: Horizontal scale", "h: Horizontal shift"] },
    ])
    // At the defaults: no ↺ and no Reset all, the flip toggles off (R2).
    expect(document.querySelector('[data-testid$="-reset"]')).toBeNull()
    expect(document.querySelector('[data-testid="fv-reset-all"]')).toBeNull()
    expect(byTestId(screen, "fv-param-a-flip").getAttribute("aria-pressed")).toBe("false")
    expect((byTestId(screen, "fv-param-b-field") as HTMLInputElement).value).toBe("1")
  })

  it("flips a scale, resets one and resets all (R8, FV 07 › Reset)", async () => {
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "a", "2")
    typeParam(screen, "k", "4")
    typeParam(screen, "h", "-1")
    click(screen, "fv-param-a-flip")
    expect(byTestId(screen, "fv-param-a-flip").getAttribute("aria-pressed")).toBe("true")
    expect(valueOf(screen, "a")).toBe("−2")
    expect(byTestId(screen, "func-readout").getAttribute("aria-label")).toBe("f(x) = −2(x + 1)² + 4")
    expect(curveF()?.fn(0.5)).toBe(-0.5)
    click(screen, "fv-param-k-reset")
    expect(valueOf(screen, "k")).toBe("0")
    expect(document.querySelector('[data-testid="fv-param-k-reset"]')).toBeNull()
    click(screen, "fv-reset-all")
    expect(["a", "b", "h", "k"].map((param) => valueOf(screen, param))).toEqual(["1", "1", "0", "0"])
    expect(document.querySelector('[data-testid="fv-reset-all"]')).toBeNull()
  })

  it("refuses a typed scale of 0 and keeps the field open (FV 07)", async () => {
    const screen = await render(<FunctionViewer />)
    typeParam(screen, "b", "0")
    const field = byTestId(screen, "fv-param-b-field") as HTMLInputElement
    expect(field.getAttribute("aria-invalid")).toBe("true")
    expect(field.value).toBe("0")
    expect(valueOf(screen, "b")).toBe("1")
    expect(byTestId(screen, "fv-param-b").hasAttribute("data-error")).toBe(true)
    keydown(field, "Escape")
    expect(field.value).toBe("1")
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
    expect(valueOf(screen, "k")).toBe("1.5")
    expect(document.activeElement).toBe(ruler)
    keydown(ruler, "Backspace")
    expect(valueOf(screen, "k")).toBe("0")
  })

  it("starts P at x = 2 (D4): its card reads f(2) = 4", async () => {
    const screen = await render(<FunctionViewer />)
    expect((byTestId(screen, "fv-p-field") as HTMLInputElement).value).toBe("2")
    expect(readout(screen, "fv-p-readout")).toBe("f(2) = 4")
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
    expect(readout(screen, "fv-p-readout")).toBe("f(0.5) = 5.5")
    expect(pointOf("p")).toMatchObject({ x: 0.5, y: 5.5 })
    // P lands on 0.12, and f(0.12) = 3.5088 prints rounded.
    typeInto(screen, "fv-p-field", "0.123")
    expect(readout(screen, "fv-p-readout")).toBe("f(0.12) ≈ 3.51")
  })

  it("shows Q's placeholders until the pointer is on the plane, at one height (R2, R3)", async () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(ZERO_RECT)
    const screen = await render(<FunctionViewer />)
    const q = byTestId(screen, "fv-point-q")
    expect(readout(screen, "fv-q-readout")).toBe("f(–) = –")
    expect(spoken(q)).toContain("Point at the plane to place Q")
    const canvas = byTestId(screen, "cartesian-canvas")
    // A zero rect at 100 %: the origin at (0, 0), 50 px per unit.
    act(() => {
      canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: -75, clientY: -112.5 }))
    })
    expect(readout(screen, "fv-q-readout")).toBe("f(−1.5) = 2.25")
    expect(spoken(q)).toContain("x follows your pointer · y = f(x)")
    expect(hint(screen)).toBe("Q follows your pointer · drag to pan · scroll to zoom")
    act(() => {
      canvas.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }))
    })
    expect(readout(screen, "fv-q-readout")).toBe("f(–) = –")
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
    expect(readout(screen, "fv-p-readout")).toBe("f(3.1) = 9.61")
    keydown(scrubber, "Enter")
    const field = byTestId(screen, "fv-p-field") as HTMLInputElement
    expect(document.activeElement).toBe(field)
    expect(hint(screen)).toBe("Enter apply · Esc cancel · Up arrow Down arrow nudge 0.01")
    act(() => {
      setInput(field, "-1.5")
    })
    keydown(field, "Enter")
    expect(readout(screen, "fv-p-readout")).toBe("f(−1.5) = 2.25")
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
    expect(hint(screen)).toBe("Type a number such as 1.5 · Esc puts back 1")
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
    expect(readout(screen, "fv-p-readout")).toBe("f(2.1) = 4.41")
    keydown(plane, "[")
    keydown(plane, "[")
    expect(readout(screen, "fv-p-readout")).toBe("f(1.9) = 3.61")
    expect(pointOf("p")).toMatchObject({ x: 1.9, y: 3.61 })
  })
})
