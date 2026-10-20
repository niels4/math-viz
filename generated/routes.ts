import _not_found$0 from "#src/pages/_not_found.page.tsx"
import _root$1 from "#src/pages/_root.page.tsx"
import colors$2 from "#src/pages/dev/colors.page.tsx"
import concept$3 from "#src/pages/dev/concept.page.tsx"
import fonts$4 from "#src/pages/dev/fonts.page.tsx"
import dev$5 from "#src/pages/dev.page.tsx"
import function_viewer$6 from "#src/pages/function-viewer.page.tsx"

const routes = {
  "_not_found": _not_found$0,
  "": _root$1,
  "dev/colors": colors$2,
  "dev/concept": concept$3,
  "dev/fonts": fonts$4,
  "dev": dev$5,
  "function-viewer": function_viewer$6
} as const

export default routes