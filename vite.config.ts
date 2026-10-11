/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react"
import { playwright } from "@vitest/browser-playwright"
import typedCssModules from "unplugin-typed-css-modules/vite"
import { defineConfig } from "vite"
import wtr from "vite-plugin-websocket-text-relay"

const allSourceFiles = ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}"]
const browserTestFiles = "src/**/*.test.{ts,tsx}"
const nodeTestFiles = "scripts/**/*.test.{ts,tsx}"

const disableWtr = process.env["DISABLE_WTR"] === "1" || process.env["DISABLE_WTR"] === "true"

// https://vite.dev/config/
export default defineConfig({
  plugins: [typedCssModules(), react({ compiler: true }), ...(disableWtr ? [] : [wtr()])],

  // GitHub Pages serves main's docs/ at /math-viz/: relative asset paths work under
  // that prefix, and hash routing needs no server rewrites.
  base: "./",
  build: { outDir: "docs", emptyOutDir: true },

  test: {
    attachmentsDir: ".local/vitest-attachments",
    coverage: {
      include: allSourceFiles,
      exclude: ["src/test/*.{ts,tsx}", "scripts/**/*.script.ts", ".local"],
      // terminal: compact summary only; full per-file table via `--coverage.reporter=text`, html/lcov detail in coverage/
      reporter: ["text-summary", "html", "lcov"],
    },

    projects: [
      {
        test: {
          name: "browser",
          include: [browserTestFiles],
          setupFiles: ["src/test/browser-setup.ts"],
          browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },

      {
        test: {
          name: "jsdom",
          include: [browserTestFiles, nodeTestFiles],
          setupFiles: ["src/test/jsdom-setup.ts"],
          environment: "jsdom",
        },
      },
    ],
  },
})
