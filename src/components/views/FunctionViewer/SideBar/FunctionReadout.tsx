import type { ReactNode } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { aParam, bParam, funcParam, hParam, kParam } from "../queryParams"
import style from "./FunctionReadout.module.css"

const MINUS = "−"

const formatValue = (v: number): string => v.toFixed(2).replace("-", MINUS)

const signed = (v: number, positive: string, negative: string): string =>
  `${v >= 0 ? positive : negative} ${formatValue(Math.abs(v))}`

const Term = ({ param, children }: { param: "a" | "b" | "h" | "k"; children: string }) => (
  <span className={style.term} data-param={param}>
    {children}
  </span>
)

const EXPONENTS: Partial<Record<string, string>> = { x2: "2", x3: "3" }

export const FunctionReadout = () => {
  const [func] = useQueryParam(funcParam)
  const [a] = useQueryParam(aParam)
  const [b] = useQueryParam(bParam)
  const [h] = useQueryParam(hParam)
  const [k] = useQueryParam(kParam)

  const x = <var>x</var>
  const stacked = b !== 1
  const bare = h === 0 && !stacked
  const shifted =
    h === 0 ? (
      x
    ) : (
      <>
        {x} <Term param="h">{signed(h, MINUS, "+")}</Term>
      </>
    )
  const inner = stacked ? (
    <span className={style.frac}>
      <span>{shifted}</span>
      <span className={style.bar} />
      <span>
        <Term param="b">{formatValue(b)}</Term>
      </span>
    </span>
  ) : (
    shifted
  )
  const paren = (s: string) => <span className={stacked ? style.paren_big : undefined}>{s}</span>
  const wrapped = (
    <>
      {paren("(")}
      {inner}
      {paren(")")}
    </>
  )

  const exponent = EXPONENTS[func]
  let body: ReactNode
  if (func === "sinx") {
    body = <>sin{wrapped}</>
  } else if (exponent === undefined) {
    body = a !== 1 && !bare ? wrapped : inner
  } else {
    body = (
      <>
        {bare ? x : wrapped}
        <sup className={style.sup}>{exponent}</sup>
      </>
    )
  }

  return (
    <output className={style.readout}>
      <span className={style.line}>
        <var>f</var>(<var>x</var>) = {a !== 1 && <Term param="a">{formatValue(a)}</Term>}
        {a !== 1 && func === "sinx" && " "}
        {body}
        {k !== 0 && (
          <>
            {" "}
            <Term param="k">{signed(k, "+", MINUS)}</Term>
          </>
        )}
      </span>
    </output>
  )
}
