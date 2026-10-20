import _not_found$0 from "#src/pages/_not_found.page.tsx"
import _root$1 from "#src/pages/_root.page.tsx"
import colors$2 from "#src/pages/dev/colors.page.tsx"
import concept$3 from "#src/pages/dev/concept.page.tsx"
import development$4 from "#src/pages/dev/development.page.tsx"
import figma$5 from "#src/pages/dev/figma.page.tsx"
import fonts$6 from "#src/pages/dev/fonts.page.tsx"
import function_viewer_alpha$7 from "#src/pages/dev/function-viewer-alpha.page.tsx"
import prototype$8 from "#src/pages/dev/prototype.page.tsx"
import dev$9 from "#src/pages/dev.page.tsx"
import function_viewer$10 from "#src/pages/function-viewer.page.tsx"

const routes = {
  "_not_found": _not_found$0,
  "": _root$1,
  "dev/colors": colors$2,
  "dev/concept": concept$3,
  "dev/development": development$4,
  "dev/figma": figma$5,
  "dev/fonts": fonts$6,
  "dev/function-viewer-alpha": function_viewer_alpha$7,
  "dev/prototype": prototype$8,
  "dev": dev$9,
  "function-viewer": function_viewer$10
} as const

export default routes