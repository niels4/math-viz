import style from "./_root.page.module.css"

const TableOfContents = () => {
  return (
    <section>
      <header>
        <h2>Basics</h2>
        <p>Examples of basic webapp features such as routing, links, and URL search parameters</p>
      </header>

      <nav>
        <a href="#basics/search-params?count=7">Search Params</a>
        <p>Example of reading and setting URL search parameters</p>

        <a href="#basics/counter">Counter</a>
        <p>Increment a number stored in the URL search parameters</p>

        <a href="#basics/theme-demo">Theme Demo</a>
        <p>
          Scoped CSS Module themes per page — no global pollution. Reference templates in src/style/themes/ —
          Neon Noir (dark) + Default (light) with _ utilities
        </p>

        <a href="#basics/font-demo">Font Demo</a>
        <p>
          Scoped CSS Module fonts per page — no global pollution. Reference templates in src/style/fonts/ —
          Inter + Fraunces + Bebas Neue with font-family
        </p>
      </nav>
    </section>
  )
}

const RootPage = () => {
  return (
    <main className={style.root_page} data-testid="root-view">
      <h1>Live Demo - Vite</h1>
      <p>
        A demo of a live coding environment using &nbsp;
        <a target="_blank" href="https://github.com/niels4/websocket-text-relay">
          websocket-text-relay
        </a>
        .
      </p>
      <p>
        Built with Vite, Typescript, and React. Live editing (hot module reloading as you type, no need to
        save the file) provided by &nbsp;
        <a target="_blank" href="https://github.com/niels4/vite-plugin-websocket-text-relay">
          vite-plugin-websocket-text-relay
        </a>
      </p>
      <TableOfContents />
    </main>
  )
}

export default RootPage
