import switchStyles from "./Switch.module.css"

export function Switch({
  checked,
  onChange,
  label,
  testId,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  testId: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      data-on={checked ? "true" : "false"}
      className={switchStyles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={switchStyles.switch_track} aria-hidden="true">
        <span className={switchStyles.switch_knob} />
        <span className={switchStyles.switch_state}>{checked ? "ON" : "OFF"}</span>
      </span>
    </button>
  )
}
