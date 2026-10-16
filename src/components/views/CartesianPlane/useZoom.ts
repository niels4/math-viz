import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react"

const zoomSpeed = 0.001

export const useZoom = (
  ref: RefObject<HTMLCanvasElement | null>,
  setZoom: Dispatch<SetStateAction<number>>,
) => {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      return
    }

    const onZoom = (e: WheelEvent) => {
      setZoom((zoom) => Math.min(5, Math.max(0.1, zoom + e.deltaY * zoomSpeed)))
    }

    canvas.addEventListener("wheel", onZoom)
    return () => {
      canvas.removeEventListener("wheel", onZoom)
    }
  }, [ref, setZoom])
}
