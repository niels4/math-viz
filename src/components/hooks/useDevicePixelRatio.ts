import { useEffect, useState } from "react"

export const useDevicePixelRatio = () => {
  const [dpr, setDpr] = useState(() => window.devicePixelRatio ?? 1)

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return
    }
    const query = window.matchMedia(`(resolution: ${dpr}dppx)`)
    const update = () => {
      setDpr(window.devicePixelRatio ?? 1)
    }
    query.addEventListener("change", update)
    return () => {
      query.removeEventListener("change", update)
    }
  }, [dpr])

  return dpr
}
