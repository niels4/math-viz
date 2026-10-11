import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"

import routes from "#generated/routes.ts"
import "#src/style/global.css"
import { style_vars } from "#src/style/style_vars.module.css"

import { Router } from "./components/router/Router.tsx"
import { useAppTheme } from "./state/useAppTheme.ts"

const rootElement = document.getElementById("root")!

export const Root = () => {
  const { themeClass } = useAppTheme()

  useEffect(() => {
    document.body.className = `${themeClass} ${style_vars}`
  }, [themeClass])

  return (
    <StrictMode>
      <Router routes={routes} />
    </StrictMode>
  )
}

createRoot(rootElement).render(<Root />)
