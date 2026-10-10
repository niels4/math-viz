import _not_found$0 from "#src/pages/_not_found.page.tsx"
import _root$1 from "#src/pages/_root.page.tsx"
import function_viewer_v2$2 from "#src/pages/demos/function-viewer-v2.page.tsx"
import function_viewer$3 from "#src/pages/demos/function-viewer.page.tsx"
import cartesian_plane$4 from "#src/pages/dev/components/cartesian-plane.page.tsx"
import ui$5 from "#src/pages/dev/components/ui.page.tsx"
import font_demo$6 from "#src/pages/dev/font-demo.page.tsx"
import theme_demo$7 from "#src/pages/dev/theme-demo.page.tsx"
import function_viewer_alpha$8 from "#src/pages/dev/views/function-viewer-alpha.page.tsx"

const routes = {
  "_not_found": _not_found$0,
  "": _root$1,
  "demos/function-viewer-v2": function_viewer_v2$2,
  "demos/function-viewer": function_viewer$3,
  "dev/components/cartesian-plane": cartesian_plane$4,
  "dev/components/ui": ui$5,
  "dev/font-demo": font_demo$6,
  "dev/theme-demo": theme_demo$7,
  "dev/views/function-viewer-alpha": function_viewer_alpha$8
} as const

export default routes