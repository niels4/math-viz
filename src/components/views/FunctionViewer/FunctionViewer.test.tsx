import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"

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

const stubCtx = new Proxy({}, { get: () => () => {}, set: () => true })

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

describe("FunctionViewer", () => {
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
    const curve = lastScene().curves[0]
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
    expect(lastScene().curves[0]?.fn(Math.PI / 2)).toBe(1)
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
    expect(lastScene().curves[0]?.fn(0.5)).toBe(-0.5)
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

  it("starts P at x = 2 (D4)", async () => {
    const screen = await render(<FunctionViewer />)
    expect((toElement(screen.getByTestId("p1-input")) as HTMLInputElement).value).toBe("2")
    expect(lastScene().points[0]).toMatchObject({
      id: "p",
      x: 2,
      y: 4,
      style: "bullseye",
      ink: "chartPoint1",
    })
  })
})
