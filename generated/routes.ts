import _not_found$0 from "#src/pages/_not_found.page.tsx"
import _root$1 from "#src/pages/_root.page.tsx"
import theme_demo$2 from "#src/pages/dev/theme-demo.page.tsx"
import function_viewer$3 from "#src/pages/function-viewer.page.tsx"

const routes = {
  "_not_found": _not_found$0,
  "": _root$1,
  "dev/theme-demo": theme_demo$2,
  "function-viewer": function_viewer$3
} as const

export default routes