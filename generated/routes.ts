import _not_found$0 from "#src/pages/_not_found.page.tsx"
import _root$1 from "#src/pages/_root.page.tsx"
import function_viewer$2 from "#src/pages/demos/function-viewer.page.tsx"
import cartesian_plane$3 from "#src/pages/dev/components/cartesian-plane.page.tsx"
import ui$4 from "#src/pages/dev/components/ui.page.tsx"
import font_demo$5 from "#src/pages/dev/font-demo.page.tsx"
import theme_demo$6 from "#src/pages/dev/theme-demo.page.tsx"
import function_viewer_alpha$7 from "#src/pages/dev/views/function-viewer-alpha.page.tsx"

const routes = {
  "_not_found": _not_found$0,
  "": _root$1,
  "demos/function-viewer": function_viewer$2,
  "dev/components/cartesian-plane": cartesian_plane$3,
  "dev/components/ui": ui$4,
  "dev/font-demo": font_demo$5,
  "dev/theme-demo": theme_demo$6,
  "dev/views/function-viewer-alpha": function_viewer_alpha$7
} as const

export default routes