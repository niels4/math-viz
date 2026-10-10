import { FunctionViewer } from "#src/components/views/FunctionViewer/FunctionViewer.tsx"
import { C3_SIDEBAR } from "#src/components/views/FunctionViewer/sidebar.ts"

// The Function Viewer with figma0's C3 sidebar, beside today's at
// #demos/function-viewer, so the two can be compared.
export default function FunctionViewerV2Page() {
  return <FunctionViewer sidebar={C3_SIDEBAR} />
}
