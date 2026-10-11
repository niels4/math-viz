/** Whether the browser shows this focus (Tab, not a click); false where :focus-visible is unknown. */
export const focusVisible = (el: Element): boolean => {
  try {
    return el.matches(":focus-visible")
  } catch {
    return false
  }
}
