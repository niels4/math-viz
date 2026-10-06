import { CartesianPlane } from "#src/components/views/CartesianPlane/CartesianPlane.tsx"

export default function CartesianPlanePage() {
  return <CartesianPlane plotFunc={{ xOffset: 0, xScale: 1, yOffset: 0, yScale: 1, func: (x) => x }} />
}
