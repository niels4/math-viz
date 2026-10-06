import { CartesianPlane } from "#src/components/views/CartesianPlane/CartesianPlane.tsx"

const identity = (x: number): number => x

export default function CartesianPlanePage() {
  return <CartesianPlane plotFunc={identity} />
}
