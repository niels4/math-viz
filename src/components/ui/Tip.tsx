import type { ReactNode } from "react"

import style from "./Tip.module.css"

export const Tip = ({
  className,
  tone,
  children,
}: {
  className: string
  tone?: "error" | undefined
  children: ReactNode
}) => (
  <div className={`${style.tip} ${className}`} data-tone={tone} aria-hidden="true">
    {children}
  </div>
)

export const Key = ({ children }: { children: ReactNode }) => <kbd className={style.key}>{children}</kbd>

export const ArrowKey = ({ dir }: { dir: "up" | "down" }) => (
  <Key>
    <svg
      width="18"
      height="14"
      viewBox="0 0 18 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === "up" ? "M4 8L9 2L14 8M9 2V14" : "M4 8L9 14L14 8M9 14V2"} />
    </svg>
  </Key>
)
