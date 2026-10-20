import _not_found$0 from "#src/pages/_not_found.page.tsx"
import _root$1 from "#src/pages/_root.page.tsx"
import colors$2 from "#src/pages/dev/colors.page.tsx"
import concept$3 from "#src/pages/dev/concept.page.tsx"
import figma$4 from "#src/pages/dev/figma.page.tsx"
import fonts$5 from "#src/pages/dev/fonts.page.tsx"
import function_viewer_alpha$6 from "#src/pages/dev/function-viewer-alpha.page.tsx"
import prototype$7 from "#src/pages/dev/prototype.page.tsx"
import dev$8 from "#src/pages/dev.page.tsx"
import function_viewer$9 from "#src/pages/function-viewer.page.tsx"

const routes = {
  "_not_found": _not_found$0,
  "": _root$1,
  "dev/colors": colors$2,
  "dev/concept": concept$3,
  "dev/figma": figma$4,
  "dev/fonts": fonts$5,
  "dev/function-viewer-alpha": function_viewer_alpha$6,
  "dev/prototype": prototype$7,
  "dev": dev$8,
  "function-viewer": function_viewer$9
} as const

export default routes