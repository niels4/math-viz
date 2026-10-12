import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { testMedia } from "#src/test/motion.ts"
import { act, renderHook } from "#test"

import {
  APPEARANCE_KEY,
  DEFAULT_PREFS,
  LEGACY_THEME_KEY,
  migrateLegacy,
  parsePrefs,
  showingTheme,
  useAppTheme,
  type ThemePrefs,
} from "./useAppTheme.ts"

const stored = (): unknown => JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? "null")

/** A light or dark system whose appearance can flip, as the OS's does. */
const system = (dark: boolean) => {
  const media = testMedia({ dark })
  vi.stubGlobal("matchMedia", media.matchMedia)
  return {
    flip: (toDark: boolean) => act(() => media.flip(toDark)),
    listening: media.listening,
  }
}

const theme = async () => (await renderHook(() => useAppTheme())).result

/** The theme as a new reader sees it, once every earlier reader has gone (the atoms re-read as they mount). */
const themeAgain = async (earlier: { unmount: () => unknown }) => {
  await earlier.unmount()
  return theme()
}

describe("the theme preferences", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  // D5: System, Arctic Ice for dark, Clean Teal for light.
  it("start in System, showing Arctic Ice on a dark system and Clean Teal on a light one", async () => {
    system(true)
    const hook = await renderHook(() => useAppTheme())
    const dark = hook.result
    expect(dark.current.prefs).toEqual(DEFAULT_PREFS)
    expect(dark.current.scheme).toBe("dark")
    expect(dark.current.themeSlug).toBe("arctic-ice")
    expect(dark.current.themeLabel).toBe("Arctic Ice")
    // The first read stores them.
    expect(stored()).toEqual({ mode: "system", dark: "arctic-ice", light: "clean-teal" })
    system(false)
    const light = await themeAgain(hook)
    expect(light.current.scheme).toBe("light")
    expect(light.current.themeSlug).toBe("clean-teal")
  })

  it("read a system with no matchMedia (jsdom, a server render) as dark", async () => {
    vi.stubGlobal("matchMedia", undefined)
    const result = await theme()
    expect(result.current.systemScheme).toBe("dark")
    expect(result.current.themeSlug).toBe("arctic-ice")
  })

  it("check each stored field, keeping the valid ones", () => {
    const valid: ThemePrefs = { mode: "light", dark: "tron-cyan", light: "sage-editorial" }
    // Valid as stored: the same object back.
    expect(parsePrefs(valid)).toBe(valid)
    expect(parsePrefs({ ...valid, mode: "dusk" })).toEqual({ ...valid, mode: "system" })
    // A light theme can't be the dark pick, nor the other way round.
    expect(parsePrefs({ ...valid, dark: "clean-teal" })).toEqual({ ...valid, dark: "arctic-ice" })
    expect(parsePrefs({ ...valid, light: "midnight-violet" })).toEqual({ ...valid, light: "clean-teal" })
    expect(parsePrefs({ mode: "dark" })).toEqual({ ...DEFAULT_PREFS, mode: "dark" })
    expect(parsePrefs({ ...valid, extra: 1 })).toEqual(valid)
    for (const junk of [null, "arctic-ice", 7, [], { mode: 1, dark: null, light: {} }]) {
      expect(parsePrefs(junk)).toEqual(DEFAULT_PREFS)
    }
  })

  it("read stored prefs field by field, a bad one taking its default", async () => {
    system(true)
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ mode: "dark", dark: "tron-cyan", light: "neon" }))
    const hook = await renderHook(() => useAppTheme())
    expect(hook.result.current.prefs).toEqual({ mode: "dark", dark: "tron-cyan", light: "clean-teal" })
    expect(hook.result.current.themeSlug).toBe("tron-cyan")
    localStorage.setItem(APPEARANCE_KEY, "{not json")
    expect((await themeAgain(hook)).current.prefs).toEqual(DEFAULT_PREFS)
  })

  // Spec › Migration: a theme saved by the old menu keeps showing.
  it.each([
    { slug: "tron-cyan", prefs: { mode: "dark", dark: "tron-cyan", light: "clean-teal" } },
    { slug: "arctic-ice", prefs: { mode: "dark", dark: "arctic-ice", light: "clean-teal" } },
    { slug: "sage-editorial", prefs: { mode: "light", dark: "arctic-ice", light: "sage-editorial" } },
  ])("carry $slug over from the old key, once, and keep showing it", async ({ slug, prefs }) => {
    // The system says otherwise: the saved theme still wins.
    system(prefs.mode === "light")
    localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify(slug))
    const result = await theme()
    expect(result.current.prefs).toEqual(prefs)
    expect(result.current.themeSlug).toBe(slug)
    expect(stored()).toEqual(prefs)
    expect(localStorage.getItem(LEGACY_THEME_KEY)).toBeNull()
  })

  it("start from the defaults when the old key holds no theme", async () => {
    system(true)
    localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify("neon"))
    expect((await theme()).current.prefs).toEqual(DEFAULT_PREFS)
    expect(localStorage.getItem(LEGACY_THEME_KEY)).toBeNull()
    expect(migrateLegacy(null)).toEqual(DEFAULT_PREFS)
    expect(migrateLegacy(42)).toEqual(DEFAULT_PREFS)
  })

  it("leave the old key alone once prefs are stored", async () => {
    system(true)
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ ...DEFAULT_PREFS, mode: "light" }))
    localStorage.setItem(LEGACY_THEME_KEY, JSON.stringify("tron-cyan"))
    expect((await theme()).current.themeSlug).toBe("clean-teal")
    expect(localStorage.getItem(LEGACY_THEME_KEY)).toBe('"tron-cyan"')
  })

  it("give the defaults when storage throws (a private window)", async () => {
    system(true)
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied")
    })
    expect((await theme()).current.prefs).toEqual(DEFAULT_PREFS)
  })

  // D4: System follows prefers-color-scheme live, without a reload.
  it("follow the system live in System, and only there", async () => {
    const os = system(true)
    const result = await theme()
    expect(result.current.themeSlug).toBe("arctic-ice")
    os.flip(false)
    expect(result.current.systemScheme).toBe("light")
    expect(result.current.themeSlug).toBe("clean-teal")
    os.flip(true)
    expect(result.current.themeSlug).toBe("arctic-ice")
    act(() => result.current.setMode("light"))
    os.flip(false)
    os.flip(true)
    expect(result.current.systemScheme).toBe("dark")
    expect(result.current.themeSlug).toBe("clean-teal")
  })

  it("stop listening to the system once nothing reads the theme", async () => {
    const os = system(true)
    const hook = await renderHook(() => useAppTheme())
    expect(os.listening()).toBe(1)
    await hook.unmount()
    expect(os.listening()).toBe(0)
  })

  // One pick per scheme, kept while the mode switches.
  it("keep a pick per scheme across mode switches", async () => {
    system(true)
    const result = await theme()
    act(() => result.current.setMode("light"))
    act(() => result.current.setTheme("sage-editorial"))
    act(() => result.current.setMode("dark"))
    expect(result.current.themeSlug).toBe("arctic-ice")
    act(() => result.current.setTheme("midnight-violet"))
    act(() => result.current.setMode("light"))
    expect(result.current.themeSlug).toBe("sage-editorial")
    act(() => result.current.setMode("system"))
    expect(result.current.themeSlug).toBe("midnight-violet")
    expect(stored()).toEqual({ mode: "system", dark: "midnight-violet", light: "sage-editorial" })
  })

  // D15: ThemeSwitcher and the Alpha's menu list every theme; a pick shows.
  it("show any theme from setThemeSlug, keeping System when it already shows", async () => {
    system(true)
    const result = await theme()
    act(() => result.current.setThemeSlug("tron-cyan"))
    expect(result.current.prefs).toEqual({ mode: "system", dark: "tron-cyan", light: "clean-teal" })
    act(() => result.current.setThemeSlug("educational-warm"))
    expect(result.current.prefs).toEqual({ mode: "light", dark: "tron-cyan", light: "educational-warm" })
    expect(result.current.themeSlug).toBe("educational-warm")
    expect(showingTheme({ ...DEFAULT_PREFS, mode: "dark" }, "clean-teal", "light")).toEqual({
      ...DEFAULT_PREFS,
      mode: "light",
    })
  })

  it("take another tab's change, checked", async () => {
    system(true)
    const result = await theme()
    const newValue = JSON.stringify({ mode: "light", dark: "tron-cyan", light: "nope" })
    act(() => {
      localStorage.setItem(APPEARANCE_KEY, newValue)
      dispatchEvent(new StorageEvent("storage", { key: APPEARANCE_KEY, newValue, storageArea: localStorage }))
    })
    expect(result.current.prefs).toEqual({ mode: "light", dark: "tron-cyan", light: "clean-teal" })
  })
})
