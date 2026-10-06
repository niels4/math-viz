import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"

import routes from "#generated/routes.ts"

import { useSearchParams } from "./components/router/router-hooks.ts"
import "#src/style/global.css"

import { Router } from "./components/router/Router.tsx"
import { isThemeSlug, useAppTheme } from "./state/useAppTheme.ts"

const rootElement = document.getElementById("root")!

export const Root = () => {
  const { themeClass, setThemeSlug } = useAppTheme()
  const params = useSearchParams()
  const themeParam = params.get("theme")
  if (isThemeSlug(themeParam)) {
    setThemeSlug(themeParam)
  }

  useEffect(() => {
    document.body.className = themeClass
  }, [themeClass])

  return (
    <StrictMode>
      <Router routes={routes} />
    </StrictMode>
  )
}

createRoot(rootElement).render(<Root />)
