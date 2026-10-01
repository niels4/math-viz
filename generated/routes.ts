import _not_found$0 from "#src/pages/_not_found.page.tsx"
import _root$1 from "#src/pages/_root.page.tsx"
import cartesian_plane$2 from "#src/pages/dev/components/cartesian-plane.page.tsx"
import ui$3 from "#src/pages/dev/components/ui.page.tsx"
import font_demo$4 from "#src/pages/dev/font-demo.page.tsx"
import theme_demo$5 from "#src/pages/dev/theme-demo.page.tsx"

const routes = {
  "_not_found": _not_found$0,
  "": _root$1,
  "dev/components/cartesian-plane": cartesian_plane$2,
  "dev/components/ui": ui$3,
  "dev/font-demo": font_demo$4,
  "dev/theme-demo": theme_demo$5
} as const

export default routes