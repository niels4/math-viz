import {
  SectionCard,
  SettingsMenu,
  SlidersIcon,
  TableIcon,
  TagIcon,
  TitleBlock,
  TopBar,
} from "#src/components/ui/index.ts"

import style from "./_root.page.module.css"

const RootPage = () => {
  return (
    <div className={style.page} data-testid="root-view">
      <div className={style.shell}>
        <TopBar actions={<SettingsMenu />} />
        <main className={style.main}>
          <TitleBlock
            title="MathViz"
            version="v0.0.0"
            subtitle="Browser math visualizations — interactive charts and 3D panels built with React, R3F, and d3."
          />
          <section aria-labelledby="toc-dev" className={style.dev_intro}>
            <h2 id="toc-dev">Dev</h2>
            <p>Developer-facing test pages — our own mini ad-hoc storyboard with no external dependency</p>
          </section>
          <div className={style.grid}>
            <SectionCard icon={<TagIcon />} title="UX" titleId="toc-ux">
              <div className={style.links}>
                <a href="#dev/theme-demo" className={style.link_card}>
                  <span className={style.link_title}>Theme Demo</span>
                  <span className={style.link_desc}>
                    Scoped CSS Module themes per page — no global pollution. Six MathViz themes (3 dark + 3
                    light) providing var(--*) tokens
                  </span>
                </a>
                <a href="#dev/font-demo" className={style.link_card}>
                  <span className={style.link_title}>Font Demo</span>
                  <span className={style.link_desc}>
                    Scoped CSS Module fonts per page — no global pollution. Work Sans (UI), STIX Two Text
                    (equations), Roboto Mono (metrics) with font-family
                  </span>
                </a>
              </div>
            </SectionCard>
            <SectionCard icon={<SlidersIcon />} title="Views" titleId="toc-views">
              <div className={style.links}>
                <a href="#dev/views/function-viewer" className={style.link_card}>
                  <span className={style.link_title}>Function Viewer</span>
                  <span className={style.link_desc}>
                    Interactive function plotter — graph f(x) = x, x², x³, sin(x) on a pannable,
                    pinch-zoomable cartesian plane.
                  </span>
                </a>
                <a href="#dev/views/function-viewer-alpha" className={style.link_card}>
                  <span className={style.link_title}>Function Viewer Alpha</span>
                  <span className={style.link_desc}>
                    An early prototype of the Function Viewer page: an interactive function plotter — graph
                    f(x) = x, x², x³, sin(x) on a pannable, pinch-zoomable cartesian plane.
                  </span>
                </a>
              </div>
            </SectionCard>
            <SectionCard icon={<TableIcon />} title="Components" titleId="toc-components">
              <div className={style.links}>
                <a href="#dev/components/cartesian-plane" className={style.link_card}>
                  <span className={style.link_title}>Cartesian Plane</span>
                  <span className={style.link_desc}>
                    Canvas cartesian plane component — interactive axes grid placeholder.
                  </span>
                </a>
                <a href="#dev/components/ui" className={style.link_card}>
                  <span className={style.link_title}>Component Library</span>
                  <span className={style.link_desc}>
                    Arctic-ice component library — buttons, badges, forms, slider, data table, and feedback.
                  </span>
                </a>
              </div>
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  )
}

export default RootPage
