import { atomWithStorage, createJSONStorage } from "jotai/utils"

/** FV 08 › Rules: the localStorage key that remembers the tour. */
export const FV_TOUR_KEY = "mathviz-fv-tour"

const json = createJSONStorage<boolean>(() => localStorage)

/** Anything but a stored `true` reads as not done. */
const storage = {
  ...json,
  getItem: (key: string, initialValue: boolean): boolean => {
    try {
      const stored: unknown = json.getItem(key, initialValue)
      return stored === true
    } catch {
      return initialValue
    }
  },
}

/**
 * Decision D19 (which supersedes D11's coach mark with the same rule): the
 * Function Viewer's first-minute tour runs once per browser. True once it
 * has been finished or skipped; the settings menu can show it again.
 */
export const fvTourDoneAtom = atomWithStorage<boolean>(FV_TOUR_KEY, false, storage, { getOnInit: true })
