export const selectNothingUntilRelease = ({ pointerId }: { pointerId: number }): void => {
  const cancel = (event: Event) => {
    event.preventDefault()
  }
  const release = (event: PointerEvent) => {
    if (event.pointerId === pointerId && (event.type !== "pointermove" || event.buttons === 0)) {
      end()
    }
  }
  const end = () => {
    document.removeEventListener("selectstart", cancel, true)
    window.removeEventListener("pointerup", release, true)
    window.removeEventListener("pointercancel", release, true)
    window.removeEventListener("pointermove", release, true)
    window.removeEventListener("blur", end)
  }
  document.addEventListener("selectstart", cancel, true)
  window.addEventListener("pointerup", release, true)
  window.addEventListener("pointercancel", release, true)
  window.addEventListener("pointermove", release, true)
  window.addEventListener("blur", end)
}
