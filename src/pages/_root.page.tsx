import style from "./_root.page.module.css"

const TableOfContents = () => {
  return (
    <section>
      <header>
        <h2>Dev</h2>
        <p>Developer-facing test pages — our own mini ad-hoc storyboard with no external dependency</p>
      </header>

      <nav>
        <a href="#dev/theme-demo">Theme Demo</a>
        <p>
          Scoped CSS Module themes per page — no global pollution. Six MathViz themes (3 dark + 3 light) with
          _ utilities
        </p>

        <a href="#dev/font-demo">Font Demo</a>
        <p>
          Scoped CSS Module fonts per page — no global pollution. Work Sans (UI), STIX Two Text (equations),
          Roboto Mono (metrics) with font-family
        </p>
      </nav>
    </section>
  )
}

const RootPage = () => {
  return (
    <main className={style.root_page} data-testid="root-view">
      <h1>MathViz</h1>
      <p>Browser math visualizations — interactive charts and 3D panels built with React, R3F, and d3.</p>
      <TableOfContents />
    </main>
  )
}

export default RootPage
