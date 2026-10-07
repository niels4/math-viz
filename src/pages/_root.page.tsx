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
            subtitle="Interactive math visualizations for the browser, built with React, TypeScript and Vite."
          />
          <section aria-labelledby="toc-demos" className={style.dev_intro}>
            <h2 id="toc-demos">Demos</h2>
            <p>Finished interactive views, built from the MathViz design system.</p>
          </section>
          <div className={style.grid}>
            <SectionCard icon={<SlidersIcon />} title="Views" titleId="toc-demo-views">
              <div className={style.links}>
                <a href="#demos/function-viewer" className={style.link_card}>
                  <span className={style.link_title}>Function Viewer</span>
                  <span className={style.link_desc}>
                    Pick x, x², x³ or sin x and transform it as a·f((x − h)/b) + k with rulers, handles on the
                    curve or the equation's own terms. Pin P, probe Q with the pointer, pan and zoom the
                    plane.
                  </span>
                </a>
              </div>
            </SectionCard>
          </div>
          <section aria-labelledby="toc-dev" className={style.dev_intro}>
            <h2 id="toc-dev">Dev</h2>
            <p>Developer-facing test pages: our own small storyboard, with no external dependency.</p>
          </section>
          <div className={style.grid}>
            <SectionCard icon={<TagIcon />} title="UX" titleId="toc-ux">
              <div className={style.links}>
                <a href="#dev/theme-demo" className={style.link_card}>
                  <span className={style.link_title}>Theme Demo</span>
                  <span className={style.link_desc}>
                    The six themes side by side, three dark and three light, each a CSS Module scoped to its
                    section: its oklch tokens on buttons, badges, a card, an input and twelve series colours.
                  </span>
                </a>
                <a href="#dev/font-demo" className={style.link_card}>
                  <span className={style.link_title}>Font Demo</span>
                  <span className={style.link_desc}>
                    The three self-hosted fonts from 12 to 48 px: Work Sans for the interface, STIX Two Text
                    for equations, Roboto Mono for readouts, and the glyphs their latin subsets lack.
                  </span>
                </a>
              </div>
            </SectionCard>
            <SectionCard icon={<SlidersIcon />} title="Views" titleId="toc-views">
              <div className={style.links}>
                <a href="#dev/views/function-viewer-alpha" className={style.link_card}>
                  <span className={style.link_title}>Function Viewer Alpha</span>
                  <span className={style.link_desc}>
                    The Function Viewer's first prototype, kept as a record: x and y scale and offset in
                    fields and scrub strips, one point on a slider and one under the pointer.
                  </span>
                </a>
              </div>
            </SectionCard>
            <SectionCard icon={<TableIcon />} title="Components" titleId="toc-components">
              <div className={style.links}>
                <a href="#dev/components/cartesian-plane" className={style.link_card}>
                  <span className={style.link_title}>Cartesian Plane</span>
                  <span className={style.link_desc}>
                    The plane on its own, drawing y = x: drag or the arrow keys pan; the wheel, a pinch, + and
                    − or its zoom control zoom; 0 resets the view.
                  </span>
                </a>
                <a href="#dev/components/ui" className={style.link_card}>
                  <span className={style.link_title}>Component Library</span>
                  <span className={style.link_desc}>
                    The shared UI components in any of the six themes: buttons, badges, form controls, a
                    slider, a data table with pagination, tabs and alerts.
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
