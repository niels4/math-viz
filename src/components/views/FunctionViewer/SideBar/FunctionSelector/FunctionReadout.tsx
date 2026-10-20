import { useAtomValue, useSetAtom } from "jotai"
import { useRef, type ReactNode } from "react"

import { useFitWidth } from "#src/components/hooks/useFitWidth.ts"
import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { aParam, bParam, funcParam, hParam, kParam, type FunctionSlug } from "../../queryParams"
import { highlightAtoms, hoverAtom, type TransformParam } from "../../state"
import style from "./FunctionReadout.module.css"

const MINUS = "−"

const formatValue = (v: number): string => v.toFixed(2).replace("-", MINUS)

const signed = (v: number, positive: string, negative: string): string =>
  `${v >= 0 ? positive : negative} ${formatValue(Math.abs(v))}`

const Term = ({ param, children }: { param: TransformParam; children: ReactNode }) => {
  const lit = useAtomValue(highlightAtoms[param])
  const setHover = useSetAtom(hoverAtom)

  return (
    <span
      className={style.term}
      data-param={param}
      data-lit={lit ? "" : undefined}
      onPointerEnter={() => setHover([param], true)}
      onPointerLeave={() => setHover([param], false)}
    >
      {children}
    </span>
  )
}

const EXPONENTS: Partial<Record<string, [string, string]>> = { x2: ["2", "²"], x3: ["3", "³"] }

const Hidden = ({ children }: { children: string }) => <span className={style.hidden}>{children}</span>

type Terms = { a: ReactNode; b: ReactNode; h: ReactNode; k: ReactNode }

const LETTERS: Terms = {
  a: (
    <Term param="a">
      <var>a</var>
    </Term>
  ),
  b: (
    <Term param="b">
      <var>b</var>
    </Term>
  ),
  h: (
    <>
      <span className={style.minus}>{MINUS}</span>{" "}
      <Term param="h">
        <var>h</var>
      </Term>
    </>
  ),
  k: (
    <Term param="k">
      + <var>k</var>
    </Term>
  ),
}

const Equation = ({ func, terms }: { func: FunctionSlug; terms: Terms }) => {
  const x = <var>x</var>
  const stacked = terms.b !== null
  const bare = terms.h === null && !stacked
  const shifted =
    terms.h === null ? (
      x
    ) : (
      <>
        {x} {terms.h}
      </>
    )
  const numerator =
    terms.h === null ? (
      x
    ) : (
      <>
        <Hidden>(</Hidden>
        {shifted}
        <Hidden>)</Hidden>
      </>
    )
  const inner = stacked ? (
    <span className={style.frac}>
      <span>{numerator}</span>
      <span className={style.bar} />
      <span>
        <Hidden>/</Hidden>
        {terms.b}
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
    body = terms.a !== null && !bare ? wrapped : inner
  } else {
    body = (
      <>
        {bare ? x : wrapped}
        <sup className={style.sup} aria-hidden="true">
          {exponent[0]}
        </sup>
        <Hidden>{exponent[1]}</Hidden>
      </>
    )
  }

  return (
    <>
      <var>f</var>(<var>x</var>) = {terms.a}
      {terms.a !== null && func === "sinx" && " "}
      {body}
      {terms.k !== null && <> {terms.k}</>}
    </>
  )
}

export const FunctionReadout = () => {
  const [func] = useQueryParam(funcParam)
  const [a] = useQueryParam(aParam)
  const [b] = useQueryParam(bParam)
  const [h] = useQueryParam(hParam)
  const [k] = useQueryParam(kParam)
  const rowRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLSpanElement>(null)
  useFitWidth(rowRef, lineRef)

  const values: Terms = {
    a: a === 1 ? null : <Term param="a">{formatValue(a)}</Term>,
    b: b === 1 ? null : <Term param="b">{formatValue(b)}</Term>,
    h: h === 0 ? null : <Term param="h">{signed(h, MINUS, "+")}</Term>,
    k: k === 0 ? null : <Term param="k">{signed(k, "+", MINUS)}</Term>,
  }

  return (
    <>
      <div ref={rowRef} className={style.readout} data-testid="function-readout">
        <span ref={lineRef} className={style.line}>
          <Equation func={func} terms={values} />
        </span>
      </div>
      <p className={style.form} data-testid="function-form">
        <Hidden>Form: </Hidden>
        <Equation func={func} terms={LETTERS} />
      </p>
    </>
  )
}
