/**
 * A browser's media queries for a test: motion preferred or reduced, and a
 * light or dark system that can flip as the OS's appearance does. Whole
 * MediaQueryLists: the theme follows the system's scheme through their
 * change events. Stub it with `vi.stubGlobal("matchMedia", media.matchMedia)`.
 */
export const testMedia = ({ reduce = false, dark = false }: { reduce?: boolean; dark?: boolean } = {}) => {
  const schemeListeners = new Set<(event: MediaQueryListEvent) => void>()
  let isDark = dark
  const isScheme = (query: string) => query.includes("prefers-color-scheme")
  const matchMedia = (query: string) =>
    ({
      get matches() {
        return query.includes("reduce") ? reduce : isScheme(query) && query.includes("dark") && isDark
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        if (isScheme(query)) {
          schemeListeners.add(listener)
        }
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        schemeListeners.delete(listener)
      },
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
  return {
    matchMedia,
    /** The OS turns dark or light: whatever listens to its scheme hears it (wrap in `act`). */
    flip: (toDark: boolean) => {
      isDark = toDark
      for (const listener of schemeListeners) {
        listener({ matches: toDark, media: "(prefers-color-scheme: dark)" } as MediaQueryListEvent)
      }
    },
    /** How many listen to the system's scheme. */
    listening: () => schemeListeners.size,
  }
}

/** A browser's matchMedia that prefers motion (or not), on a light system unless `dark`. */
export const motionMedia = (reduce: boolean, { dark = false }: { dark?: boolean } = {}) =>
  testMedia({ reduce, dark }).matchMedia

/** A CSS `linear()` easing with evenly spaced stops, as `cssLinear` writes them, at `progress`. */
export const runLinear = (easing: string, progress: number): number => {
  const stops = easing.slice("linear(".length, -1).split(",").map(Number)
  const at = Math.min(1, Math.max(0, progress)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(at))
  const from = stops[i] ?? 1
  return from + ((stops[i + 1] ?? from) - from) * (at - i)
}
