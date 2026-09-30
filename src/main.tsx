import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import routes from "#generated/routes.ts"

import { Router } from "./components/router/Router.tsx"
import "#src/style/global.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router routes={routes} />
  </StrictMode>,
)
