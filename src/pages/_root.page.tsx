import type { ThemeSlug } from "#src/state/theme.ts"

import { TableIcon, TagIcon } from "#src/components/ui/icons.tsx"
import { SectionCard } from "#src/components/ui/SectionCard.tsx"
import { ThemeSwitcher } from "#src/components/ui/ThemeSwitcher.tsx"
import { TitleBlock } from "#src/components/ui/TitleBlock.tsx"
import { TopBar } from "#src/components/ui/TopBar.tsx"
import { useAppTheme } from "#src/components/ui/useAppTheme.ts"

import style from "./_root.page.module.css"

const RootPage = () => {
  const { themes, themeSlug, setThemeSlug, activeTheme } = useAppTheme()
  return (
    <div className={activeTheme.theme}>
      <div className={style.page} data-testid="root-view">
        <div className={style.shell}>
          <TopBar
            wordmarkHref="#"
            actions={
              <ThemeSwitcher
                themes={themes}
                activeSlug={themeSlug}
                onSelect={(slug) => setThemeSlug(slug as ThemeSlug)}
                primaryClass={activeTheme.btn_primary}
                secondaryClass={activeTheme.btn_secondary}
              />
            }
          />
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
              <SectionCard icon={<TagIcon />} title="UX" titleId="toc-ux" cardClass={activeTheme.card}>
                <div className={style.links}>
                  <a href="#dev/theme-demo" className={`${activeTheme.card} ${style.link_card}`}>
                    <span className={style.link_title}>Theme Demo</span>
                    <span className={style.link_desc}>
                      Scoped CSS Module themes per page — no global pollution. Six MathViz themes (3 dark + 3
                      light) with _ utilities
                    </span>
                  </a>
                  <a href="#dev/font-demo" className={`${activeTheme.card} ${style.link_card}`}>
                    <span className={style.link_title}>Font Demo</span>
                    <span className={style.link_desc}>
                      Scoped CSS Module fonts per page — no global pollution. Work Sans (UI), STIX Two Text
                      (equations), Roboto Mono (metrics) with font-family
                    </span>
                  </a>
                </div>
              </SectionCard>
              <SectionCard
                icon={<TableIcon />}
                title="Components"
                titleId="toc-components"
                cardClass={activeTheme.card}
              >
                <div className={style.links}>
                  <a
                    href="#dev/components/cartesian-plane"
                    className={`${activeTheme.card} ${style.link_card}`}
                  >
                    <span className={style.link_title}>Cartesian Plane</span>
                    <span className={style.link_desc}>
                      Canvas cartesian plane component — interactive axes grid placeholder.
                    </span>
                  </a>
                  <a href="#dev/components/ui" className={`${activeTheme.card} ${style.link_card}`}>
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
    </div>
  )
}

export default RootPage
