#!/usr/bin/env node
import { join } from "node:path"

import { generateRoutes } from "./generateRoutes.ts"

const __dirname = import.meta.dirname
const generatedDir = join(__dirname, "..", "generated")

const pagesDir = join(__dirname, "..", "src", "pages")
const generatedRoutesFile = join(generatedDir, "routes.ts")

await generateRoutes(pagesDir, generatedRoutesFile)
