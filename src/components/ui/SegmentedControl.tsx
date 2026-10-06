import { Fragment, useRef, type KeyboardEvent, type ReactNode } from "react"

import segmentedStyles from "./SegmentedControl.module.css"

export type SegmentedOption<T extends string> = {
  value: T
  label: ReactNode
  /** The option's accessible name when its label isn't plain text ("x squared" for x²). */
  ariaLabel?: string
}

const keyTarget = (key: string, from: number, last: number): number | undefined => {
  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return from - 1
    case "ArrowRight":
    case "ArrowDown":
      return from + 1
    case "Home":
      return 0
    case "End":
      return last
    default:
      return undefined
  }
}

// figma0's segmented picker (function-picker-fv, FV 07): every option in
// view, one tab stop. A radiogroup: ← → (and ↑ ↓) move the selection and
// apply it at once, wrapping; Home and End jump to the ends. The caller sets
// the font; labels can be rich (maths).
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  testId,
  className,
}: {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (next: T) => void
  /** The radiogroup's accessible name. */
  label: string
  /** Each option gets `${testId}-${value}`. */
  testId?: string
  className?: string
}) {
  const buttons = useRef(new Map<T, HTMLButtonElement>())
  const selected = options.findIndex((option) => option.value === value)

  const choose = (index: number) => {
    const option = options[(index + options.length) % options.length]
    if (option === undefined) {
      return
    }
    buttons.current.get(option.value)?.focus()
    if (option.value !== value) {
      onChange(option.value)
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const target = keyTarget(event.key, Math.max(selected, 0), options.length - 1)
    if (target === undefined) {
      return
    }
    event.preventDefault()
    choose(target)
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={className === undefined ? segmentedStyles.group : `${segmentedStyles.group} ${className}`}
    >
      {options.map((option, i) => {
        const checked = option.value === value
        return (
          <Fragment key={option.value}>
            {i > 0 ? <span className={segmentedStyles.divider} aria-hidden="true" /> : null}
            <button
              ref={(node) => {
                if (node === null) {
                  buttons.current.delete(option.value)
                } else {
                  buttons.current.set(option.value, node)
                }
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={option.ariaLabel}
              // One tab stop: the checked option, or the first while none is.
              tabIndex={checked || (selected < 0 && i === 0) ? 0 : -1}
              data-testid={testId === undefined ? undefined : `${testId}-${option.value}`}
              className={segmentedStyles.option}
              onClick={() => choose(i)}
              onKeyDown={onKeyDown}
            >
              {/* Inline flow inside the flex button, so a label's spaces stay ("sin x"). */}
              <span>{option.label}</span>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}
