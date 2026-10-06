// A pointer drag selects no text. `user-select: none` on the dragged element
// isn't enough: WebKit lets a selection start inside such an element and
// extend over any text the pointer crosses, pointer capture or not, and
// Firefox selects on release from an element that allows it. So from the
// press until that pointer lets go, the document cancels `selectstart`, which
// each engine sends before a press or a drag starts a selection. A selection
// made before the press stays as it was. The hold ends as the drags do
// (AGENTS.md › pointer-capture drags): the pointer's pointerup or
// pointercancel, the window losing focus, or a move of that pointer with no
// button held, which shows its release went missing.
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
