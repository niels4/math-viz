import { type ReactNode } from "react"

import { useQueryParam } from "#src/components/router/queryParamAtom.ts"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { TopBar } from "../TopBar/TopBar"
import { baseFunctions } from "./baseFunctions"
import style from "./FunctionViewer.module.css"
import { funcParam } from "./queryParams"
import { SideBar } from "./SideBar/SideBar"

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

export const FunctionViewer = () => {
  const [func] = useQueryParam(funcParam)

  return (
    <Page>
      <TopBar />
      <SideBar />
      <CartesianPlane plotFunction={baseFunctions[func]} />
    </Page>
  )
}
