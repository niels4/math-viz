import { describe, expect, it } from "vitest"

import { updateLocationHash } from "#src/test/includes.tsx"

import {
  createFullHash,
  getRouteAndSearchString,
  trimSlashes,
  type RouteAndSearchString,
} from "./router-util.ts"

describe("router-util", () => {
  describe("trimSlashes", () => {
    const tests: [string, string][] = [
      ["", ""], // should not transform
      ["hello/there", "hello/there"], // should not transform
      ["/", ""],
      ["//", ""],
      ["///////", ""],
      ["/hello", "hello"],
      ["hello/", "hello"],
      ["/hello/", "hello"],
      ["////hello/////", "hello"],
      ["////hello/there/////", "hello/there"],
      ["////hello//there/////", "hello/there"],
      ["////hello///there/////", "hello/there"],
      ["/////hello//////there/////", "hello/there"],
    ]

    it.each(tests)("'%s' should be trimmed to '%s'", (route, expected) => {
      const result = trimSlashes(route)
      expect(result).toEqual(expected)
    })
  })

  describe("getRouteAndSearchString", () => {
    const tests: [string, RouteAndSearchString][] = [
      ["", { route: "", search: "" }],
      ["#", { route: "", search: "" }],
      ["#/", { route: "/", search: "" }], // slashes aren't automatically removed here
      ["#hello-there", { route: "hello-there", search: "" }],
      ["?search", { route: "", search: "search" }],
      ["#?search", { route: "", search: "search" }],
      ["#sub-dir/page-1?search=hi&param2=val2", { route: "sub-dir/page-1", search: "search=hi&param2=val2" }],
    ]

    it.each(tests)("%s", async (locationHash, expected) => {
      await updateLocationHash(locationHash)
      const result = getRouteAndSearchString()
      expect(result).toEqual(expected)
    })
  })

  describe("createFullHash", () => {
    const tests: [string, string, string][] = [
      ["", "", ""],
      ["", "param1=hello", "?param1=hello"],
      ["page-1", "", "page-1"],
      ["page-1", "param1=hello", "page-1?param1=hello"],
    ]

    it.each(tests)("'%s' should be trimmed to '%s'", (route, searchString, expected) => {
      const result = createFullHash(route, searchString)
      expect(result).toEqual(expected)
    })
  })
})
