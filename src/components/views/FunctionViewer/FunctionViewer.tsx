import { type ReactNode } from "react"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { TopBar } from "../TopBar/TopBar"
import style from "./FunctionViewer.module.css"
import { SideBar } from "./SideBar/SideBar"

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

export const FunctionViewer = () => {
  return (
    <Page>
      <TopBar />
      <SideBar />
      <CartesianPlane />
    </Page>
  )
}
