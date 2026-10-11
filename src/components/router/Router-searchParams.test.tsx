import { beforeAll, describe, expect, it } from "vitest"

import { renderHook, updateLocationHash } from "#test"

import { useSearchParams, useSetSearchParams } from "./router-hooks"

describe("Router - search params", () => {
  describe("useSearchParams", () => {
    describe("when there are no search params in the url", () => {
      beforeAll(async () => {
        await updateLocationHash("")
      })
      it("it should result in an empty search params object", async () => {
        const { result } = await renderHook(() => useSearchParams())
        expect(result.current).toEqual(new URLSearchParams())
      })
    })

    describe("when there are search params in the url", () => {
      const searchString = "?param1=value1&param2=value2"
      const expected = new URLSearchParams(searchString)

      beforeAll(async () => {
        await updateLocationHash(searchString)
      })

      it("it should result in a populated search params object", async () => {
        const { result } = await renderHook(() => useSearchParams())
        expect(result.current).toEqual(expected)
      })
    })

    describe("when we have search params and a route", () => {
      const searchString = "?param1=value1&param2=value2"
      const expected = new URLSearchParams(searchString)

      beforeAll(async () => {
        await updateLocationHash(`#page-1${searchString}`)
      })

      it("it should result in a populated search params object", async () => {
        const { result } = await renderHook(() => useSearchParams())
        expect(result.current).toEqual(expected)
      })
    })

    describe("when changing search params", () => {
      const searchString = "?param1=value1&param2=value2"
      const expected = new URLSearchParams(searchString)

      const searchString2 = "?param3=value3&param4=value4"
      const expected2 = new URLSearchParams(searchString2)

      const searchString3 = "?param5=value5"

      beforeAll(async () => {
        await updateLocationHash(searchString)
      })

      it("it should start with a populated search params object and update until its unmounted", async () => {
        const { result, unmount } = await renderHook(() => useSearchParams())
        expect(result.current).toEqual(expected)
        await updateLocationHash(searchString2)
        expect(result.current).toEqual(expected2)
        await unmount()

        await updateLocationHash(searchString3)
        // should not update anymore after unmounting
        expect(result.current).toEqual(expected2)
      })
    })
  })

  describe("useSetSearchParams", () => {
    describe("when the search string is empty", () => {
      const startingHash = ""
      const expectedHash = "#?param1=value1&param2=val2"
      beforeAll(async () => {
        await updateLocationHash(startingHash)
      })

      it("should set the search string in the url hash to contain the key value pairs", async () => {
        const { result } = await renderHook(() => useSetSearchParams())
        const setSearchParams = result.current
        setSearchParams({ param1: "value1", param2: "val2" })
        expect(window.location.hash).toEqual(expectedHash)
      })
    })

    describe("when the search string already contains values", () => {
      const startingHash = "#?param1=value1&param2=val2&param3=three"
      const expectedHash = "#?param1=value1&param3=four"
      beforeAll(async () => {
        await updateLocationHash(startingHash)
      })

      it("should update any non values, delete any null values, and leave unchanged params the same", async () => {
        const { result } = await renderHook(() => useSetSearchParams())
        const setSearchParams = result.current
        setSearchParams({ param2: null, param3: "four" })
        expect(window.location.hash).toEqual(expectedHash)
      })
    })
  })
})
