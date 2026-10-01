import alertStyles from "./AlertStack.module.css"

export type AlertKind = "info" | "success" | "warning"

export type AlertItem = {
  id: string
  kind: AlertKind
  title: string
}

const KIND_STYLES: Record<AlertKind, string> = {
  info: alertStyles.alert_info,
  success: alertStyles.alert_success,
  warning: alertStyles.alert_warning,
}

export function AlertStack({
  alerts,
  onDismiss,
}: {
  alerts: ReadonlyArray<AlertItem>
  onDismiss: (id: string) => void
}) {
  if (alerts.length === 0) {
    return <p className={alertStyles.alert_empty}>You&apos;re all caught up.</p>
  }
  return (
    <div className={alertStyles.alert_stack}>
      {alerts.map((alert) => (
        <div key={alert.id} className={`${alertStyles.alert} ${KIND_STYLES[alert.kind]}`} role="alert">
          <span className={alertStyles.alert_text}>{alert.title}</span>
          <button
            type="button"
            aria-label={`Dismiss ${alert.id} notification`}
            data-testid={`dismiss-${alert.id}`}
            className={alertStyles.alert_close}
            onClick={() => onDismiss(alert.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
