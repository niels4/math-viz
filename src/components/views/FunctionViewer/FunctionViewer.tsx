import { type ReactNode } from "react"

import { CartesianPlane } from "../CartesianPlane/CartesianPlane"
import { TopBar } from "../TopBar/TopBar"
import style from "./FunctionViewer.module.css"

const Page = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return <div className={style.page}>{children}</div>
}

const SideBar = () => {
  return <div className={style.sidebar}>Sidebar!</div>
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
