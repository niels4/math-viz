import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { basename, join } from "node:path"
import { beforeAll, describe, expect, it } from "vitest"

import { generateRoutes, isValidRoute } from "./generateRoutes.ts"

const testDir = join(process.cwd(), ".local", "test", "generate-routes")

const createFixturePaths = (testName: string) => ({
  pagesDir: join(testDir, `pages-${testName}`),
  outputFile: join(testDir, `output-${testName}.tsx`),
})

describe("generate-routes", () => {
  beforeAll(async () => {
    await rm(testDir, { recursive: true, force: true })
    await mkdir(testDir, { recursive: true })
  })

  describe("isValidRouteName", () => {
    describe("valid routes", () => {
      const validRoutes = ["a", "0", "9", "hello-there", "some-2-valid-a-route-7"]

      it.each(validRoutes)("%s should be a valid route", (route) => {
        const result = isValidRoute(route)
        expect(result).toBe(true)
      })
    })

    describe("invalid routes", () => {
      const invalidRoutes = [
        "-",
        "hello-",
        "some--route",
        "A",
        "sOme-route",
        "some_route",
        "_",
        "some-route.js",
        "_index",
        "_not_found",
        "readme.md",
      ]

      it.each(invalidRoutes)("%s should be an invalid route", (route) => {
        const result = isValidRoute(route)
        expect(result).toBe(false)
      })
    })
  })

  describe("Empty pages dir", () => {
    const { pagesDir, outputFile } = createFixturePaths("empty")
    const expected = {}
    let result: object

    beforeAll(async () => {
      await mkdir(pagesDir)
      await generateRoutes(pagesDir, outputFile)
      result = (await import(outputFile)).default
    })

    it("should create an empty routes object", () => {
      expect(result).toEqual(expected)
    })
  })

  describe("when _root and _not_found pages are defined", () => {
    const { pagesDir, outputFile } = createFixturePaths("with-root")
    const expected = { "": "root page", _not_found: "not found page" }
    let result: object

    beforeAll(async () => {
      await mkdir(pagesDir)
      await writeFile(join(pagesDir, "_root.page.tsx"), 'export default "root page"')
      await writeFile(join(pagesDir, "_not_found.page.tsx"), 'export default "not found page"')
      const pagesDirName = basename(pagesDir)
      await generateRoutes(pagesDir, outputFile, `./${pagesDirName}/`)
      result = (await import(outputFile)).default
      const outputText = (await readFile(outputFile)).toString()
      console.log("output:", outputText)
    })

    it("should create a routes object with root and _not_found properties", () => {
      expect(result).toEqual(expected)
    })
  })

  describe("when the pages dir contains a typical layout with a subdirectory", () => {
    const { pagesDir, outputFile } = createFixturePaths("typical")
    const expected = {
      "": "root page",
      _not_found: "not found page",
      "page-1": "page 1",
      "subdir/page-2": "page 2",
    }
    let result: object

    beforeAll(async () => {
      await mkdir(pagesDir)
      const subdir = join(pagesDir, "subdir")
      await mkdir(subdir)
      await writeFile(join(pagesDir, "_root.page.tsx"), 'export default "root page"')
      await writeFile(join(pagesDir, "_not_found.page.tsx"), 'export default "not found page"')
      await writeFile(join(pagesDir, "page-1.page.tsx"), 'export default "page 1"')
      await writeFile(join(subdir, "page-2.page.tsx"), 'export default "page 2"')

      const pagesDirName = basename(pagesDir)
      await generateRoutes(pagesDir, outputFile, `./${pagesDirName}/`)
      result = (await import(outputFile)).default
      const outputText = (await readFile(outputFile)).toString()
      console.log("output:", outputText)
    })

    it("should create a routes object with root and _not_found properties", () => {
      expect(result).toEqual(expected)
    })
  })

  describe("When the pages dir has an invalid file name", () => {
    const { pagesDir, outputFile } = createFixturePaths("invalid-base")

    beforeAll(async () => {
      await mkdir(pagesDir)
      await writeFile(join(pagesDir, "Bad-file.page.tsx"), 'export default "bad file"')
    })

    it("should throw an error", async () => {
      const pagesDirName = basename(pagesDir)
      await expect(generateRoutes(pagesDir, outputFile, `./${pagesDirName}/`)).rejects.toThrow()
    })
  })

  describe("When a subdir has an invalid file name", () => {
    const { pagesDir, outputFile } = createFixturePaths("invalid-subdir")

    beforeAll(async () => {
      await mkdir(pagesDir)
      const subdir = join(pagesDir, "subdir")
      await mkdir(subdir)
      await writeFile(join(subdir, "Bad-file.page.tsx"), 'export default "bad file"')
    })

    it("should throw an error", async () => {
      const pagesDirName = basename(pagesDir)
      await expect(generateRoutes(pagesDir, outputFile, `./${pagesDirName}/`)).rejects.toThrow()
    })
  })

  describe("When a subdir has a _root.page.tsx file", () => {
    const { pagesDir, outputFile } = createFixturePaths("invalid-subdir-root")

    beforeAll(async () => {
      await mkdir(pagesDir)
      const subdir = join(pagesDir, "subdir")
      await mkdir(subdir)
      await writeFile(join(subdir, "_root.page.tsx"), 'export default "root page"')
    })

    it("should throw an error", async () => {
      const pagesDirName = basename(pagesDir)
      await expect(generateRoutes(pagesDir, outputFile, `./${pagesDirName}/`)).rejects.toThrow()
    })
  })

  describe("When a subdir has a _not_found.page.tsx file", () => {
    const { pagesDir, outputFile } = createFixturePaths("invalid-subdir-not-found")

    beforeAll(async () => {
      await mkdir(pagesDir)
      const subdir = join(pagesDir, "subdir")
      await mkdir(subdir)
      await writeFile(join(subdir, "_not_found.page.tsx"), 'export default "not found page"')
    })

    it("should throw an error", async () => {
      const pagesDirName = basename(pagesDir)
      await expect(generateRoutes(pagesDir, outputFile, `./${pagesDirName}/`)).rejects.toThrow()
    })
  })
})
