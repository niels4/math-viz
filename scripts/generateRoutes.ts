import { mkdir, readdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

const fileSuffix = ".page.tsx"

const validRouteRegex = /^[a-z0-9](-?[a-z0-9])*$/
// route may only contain lowercase letters, numbers, and dashes
// route may not start or end with dash, or have multiple dashes in a row
// see generate-routes.test.ts for examples
export const isValidRoute = (fileName: string): boolean => validRouteRegex.test(fileName)

const rootOrNotFound = new Set(["_root", "_not_found"])
const isRootOrNotFound = (isRootDir: boolean, path: string) => isRootDir && rootOrNotFound.has(path)

const getRoutePaths = async (dir: string, isRootDir = true): Promise<string[]> => {
  let paths: string[] = []

  const files = await readdir(dir, { withFileTypes: true })
  for (const file of files) {
    if (file.isFile() && file.name.endsWith(fileSuffix)) {
      const path = file.name.substring(0, file.name.length - fileSuffix.length)
      if (!isValidRoute(path) && !isRootOrNotFound(isRootDir, path)) {
        const fullPath = join(dir, file.name)
        throw new Error("Invalid file name for generating route: " + fullPath)
      }
      paths.push(path)
    }
    if (file.isDirectory() && isValidRoute(file.name)) {
      const subPaths = await getRoutePaths(join(dir, file.name), false)
      paths = paths.concat(subPaths.map((p) => `${file.name}/${p}`))
    }
  }
  return paths
}

const createVariableName = (route: string, index: number) => {
  const sections = route.split("/")
  return sections.at(-1)?.replaceAll("-", "_") + "$" + index
}

const generateFile = (routePaths: string[], importPrefix: string): string => {
  const importStatements: string[] = []
  const routeMappings: string[] = []

  routePaths.forEach((route, i) => {
    const varName = createVariableName(route, i)
    importStatements.push(`import ${varName} from "${importPrefix}${route}${fileSuffix}"`)
    routeMappings.push(`  "${route === "_root" ? "" : route}": ${varName}`)
  })

  return `${importStatements.join("\n")}

const routes = {
${routeMappings.join(",\n")}
} as const

export default routes`
}

export const generateRoutes = async (pagesDir: string, outputFile: string, importPrefix = "#src/pages/") => {
  const routePaths = await getRoutePaths(pagesDir)
  const fileContents = generateFile(routePaths, importPrefix)
  const outputDir = dirname(outputFile)
  await mkdir(outputDir, { recursive: true })
  await writeFile(outputFile, fileContents)
}
