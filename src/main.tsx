import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"

import routes from "#generated/routes.ts"
import "#src/style/global.css"

import { Router } from "./components/router/Router.tsx"
import { useAppTheme } from "./state/useAppTheme.ts"

const rootElement = document.getElementById("root")!

export const Root = () => {
  const { themeClass, scheme } = useAppTheme()

  // The theme's class carries its tokens; its scheme lets native parts
  // (scrollbars, form controls) follow light or dark.
  useEffect(() => {
    document.body.className = themeClass
    document.body.style.colorScheme = scheme
  }, [themeClass, scheme])

  return (
    <StrictMode>
      <Router routes={routes} />
    </StrictMode>
  )
}

createRoot(rootElement).render(<Root />)
