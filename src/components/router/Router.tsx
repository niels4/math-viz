import { useRoute } from "./router-hooks"

export type RoutesObject = Record<string, React.ComponentType>

const NotFoundPlaceholder = () => (
  <div data-testid="placeholder-error-view">
    <h1>Error</h1>
    <p>Page not found</p>
  </div>
)

export type RouterProps = {
  routes: RoutesObject
}

export const Router = ({ routes }: RouterProps) => {
  const route = useRoute()

  // Only the routes' own keys are pages: #constructor or #__proto__ would
  // read Object.prototype.
  const page = Object.hasOwn(routes, route) ? routes[route] : undefined
  const CurrentPage = page ?? routes["_not_found"] ?? NotFoundPlaceholder

  return <CurrentPage />
}
