import type { PlaneScene } from "#src/components/views/CartesianPlane/scene.ts"

import { MathText } from "#src/components/ui/MathText.tsx"
import { CartesianPlane } from "#src/components/views/CartesianPlane/CartesianPlane.tsx"

// The bare plane: one curve, no view of its own, so it shows the plane works
// without the Function Viewer.
const SCENE: PlaneScene = {
  curves: [{ id: "y", fn: (x) => x, ink: "chartLine", width: 3.5, glow: true }],
  points: [],
}

export default function CartesianPlanePage() {
  return <CartesianPlane scene={SCENE} caption={<MathText text="y = x" />} />
}
