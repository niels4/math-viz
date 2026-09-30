import _not_found$0 from "#src/pages/_not_found.page.tsx"
import _root$1 from "#src/pages/_root.page.tsx"
import counter$2 from "#src/pages/basics/counter.page.tsx"
import font_demo$3 from "#src/pages/basics/font-demo.page.tsx"
import search_params$4 from "#src/pages/basics/search-params.page.tsx"
import theme_demo$5 from "#src/pages/basics/theme-demo.page.tsx"

const routes = {
  "_not_found": _not_found$0,
  "": _root$1,
  "basics/counter": counter$2,
  "basics/font-demo": font_demo$3,
  "basics/search-params": search_params$4,
  "basics/theme-demo": theme_demo$5
} as const

export default routes