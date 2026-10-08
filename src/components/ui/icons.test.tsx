import { describe, expect, it } from "vitest"

import { render, toElement } from "#test"

import faviconSvg from "../../../public/favicon.svg?raw"
import { SnowflakeIcon } from "./icons.tsx"

const pathsOf = (root: ParentNode) => [...root.querySelectorAll("path")].map((path) => path.getAttribute("d"))

describe("SnowflakeIcon", () => {
  // The favicon is the wordmark's mark on a tile: it draws the same paths.
  it("is the mark the favicon draws", async () => {
    const screen = await render(
      <span data-testid="mark">
        <SnowflakeIcon />
      </span>,
    )
    const favicon = new DOMParser().parseFromString(faviconSvg, "image/svg+xml")
    expect(favicon.querySelector("parsererror")).toBeNull()
    expect(pathsOf(favicon)).toEqual(pathsOf(toElement(screen.getByTestId("mark"))))
  })
})
