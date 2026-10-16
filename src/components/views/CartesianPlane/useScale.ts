import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react"

const scaleSpeed = 0.001

export const useScale = (
  ref: RefObject<HTMLCanvasElement | null>,
  setScale: Dispatch<SetStateAction<number>>,
) => {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      return
    }

    const onScale = (e: WheelEvent) => {
      setScale((scale) => Math.min(5, Math.max(0.1, scale + e.deltaY * scaleSpeed)))
    }

    canvas.addEventListener("wheel", onScale)
    return () => {
      canvas.removeEventListener("wheel", onScale)
    }
  }, [ref, setScale])
}
