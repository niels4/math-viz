import { useRef, useState, type FocusEvent, type KeyboardEvent } from "react"

import arcticStyles from "#src/style/themes/mathviz_arctic_ice.module.css"

import uiStyles from "./ui.page.module.css"

const SELECT_OPTIONS = ["Linear", "Logarithmic", "Symlog"] as const
const MENU_ITEMS = ["Export PNG", "Export SVG", "Copy spec"] as const
const RADIO_OPTIONS = ["Points", "Line", "Bars"] as const
const BUTTON_VARIANTS = ["Primary", "Secondary", "Accent", "Destructive", "Ghost"] as const

type SelectOption = (typeof SELECT_OPTIONS)[number]
type MenuItem = (typeof MENU_ITEMS)[number]
type RadioOption = (typeof RADIO_OPTIONS)[number]
type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

const buttonClass = (variant: ButtonVariant): string => {
  switch (variant) {
    case "Primary":
      return arcticStyles.btn_primary
    case "Secondary":
      return arcticStyles.btn_secondary
    case "Accent":
      return uiStyles.btn_accent
    case "Destructive":
      return uiStyles.btn_destructive
    case "Ghost":
      return uiStyles.btn_ghost
  }
}

export default function UiPage() {
  const [scale, setScale] = useState<SelectOption>("Linear")
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuChoice, setMenuChoice] = useState<MenuItem>("Export PNG")
  const [seriesKind, setSeriesKind] = useState<RadioOption>("Points")
  const [label, setLabel] = useState("Revenue")
  const [sliderValue, setSliderValue] = useState(40)
  const [lastAction, setLastAction] = useState("none yet")
  const [totalClicks, setTotalClicks] = useState(0)
  const [gridOn, setGridOn] = useState(true)
  const [showLegend, setShowLegend] = useState(false)

  const handleButtonClick = (variant: ButtonVariant) => {
    setLastAction(variant)
    setTotalClicks((count) => count + 1)
  }

  const menuRef = useRef<HTMLDivElement | null>(null)

  const handleMenuBlur = (event: FocusEvent<HTMLButtonElement>) => {
    const related = event.relatedTarget
    if (related instanceof Node && menuRef.current?.contains(related)) {
      return
    }
    setMenuOpen(false)
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      setMenuOpen(false)
    }
  }

  return (
    <div className={arcticStyles.theme}>
      <div className={uiStyles.page} data-testid="ui-page">
        <a href="#" className={uiStyles.back_link}>
          ← Back to home
        </a>

        <div>
          <h1>UI Style Guide</h1>
          <p className={uiStyles.lede}>
            Test grounds for our UI building blocks — cards, sections with headers, subsections with smaller
            headers, and a working standard control set. Wrapped in the arctic ice theme only; everything
            below resolves off the theme CSS variables.
          </p>
        </div>

        <div className={arcticStyles.card}>
          <div className={uiStyles.readout}>
            <h2>Live state</h2>
            <dl>
              <div>
                <dt>Scale</dt>
                <dd data-testid="readout-scale">{scale}</dd>
              </div>
              <div>
                <dt>Menu</dt>
                <dd data-testid="readout-menu">{menuChoice}</dd>
              </div>
              <div>
                <dt>Series</dt>
                <dd data-testid="readout-radio">{seriesKind}</dd>
              </div>
              <div>
                <dt>Label</dt>
                <dd data-testid="readout-label">{label === "" ? "(empty)" : label}</dd>
              </div>
              <div>
                <dt>Detail</dt>
                <dd data-testid="readout-slider">{sliderValue}</dd>
              </div>
              <div>
                <dt>Last button</dt>
                <dd data-testid="readout-action">
                  {lastAction} ({totalClicks} clicks)
                </dd>
              </div>
              <div>
                <dt>Grid</dt>
                <dd data-testid="readout-toggle">{gridOn ? "on" : "off"}</dd>
              </div>
              <div>
                <dt>Legend</dt>
                <dd data-testid="readout-legend">{showLegend ? "shown" : "hidden"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <section className={`${uiStyles.section} ${uiStyles.section_alt}`}>
          <h2>Selection</h2>
          <div className={uiStyles.card_grid}>
            <div className={arcticStyles.card}>
              <div className={uiStyles.card_pad}>
                <h3>Select</h3>
                <label className={uiStyles.label} htmlFor="ui-scale">
                  Axis scale
                </label>
                <select
                  id="ui-scale"
                  data-testid="control-scale"
                  className={`${arcticStyles.input} ${uiStyles.field_control}`}
                  value={scale}
                  onChange={(event) => setScale(event.currentTarget.value as SelectOption)}
                >
                  {SELECT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className={uiStyles.hint}>Native select, themed via the shared input style.</p>
              </div>
            </div>

            <div className={arcticStyles.card}>
              <div className={uiStyles.card_pad}>
                <h3>Dropdown menu</h3>
                <div ref={menuRef} className={uiStyles.menu_wrap}>
                  <button
                    type="button"
                    data-testid="control-menu-button"
                    className={arcticStyles.btn_secondary}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                    onBlur={handleMenuBlur}
                    onKeyDown={handleMenuKeyDown}
                  >
                    {menuChoice} ▾
                  </button>
                  {menuOpen ? (
                    <ul data-testid="control-menu-list" className={uiStyles.menu_list}>
                      {MENU_ITEMS.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            data-testid={`control-menu-item-${item}`}
                            className={uiStyles.menu_item}
                            aria-current={item === menuChoice}
                            onClick={() => {
                              setMenuChoice(item)
                              setMenuOpen(false)
                            }}
                            onBlur={handleMenuBlur}
                            onKeyDown={handleMenuKeyDown}
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <p className={uiStyles.hint}>Opens on click, closes on select, blur, or Escape.</p>
              </div>
            </div>

            <div className={arcticStyles.card}>
              <div className={uiStyles.card_pad}>
                <h3>Radio group</h3>
                <fieldset className={uiStyles.fieldset}>
                  <legend className={uiStyles.label}>Series kind</legend>
                  {RADIO_OPTIONS.map((option) => (
                    <label key={option} className={uiStyles.check_label}>
                      <input
                        type="radio"
                        name="ui-series-kind"
                        data-testid={`control-radio-${option}`}
                        className={uiStyles.check}
                        value={option}
                        checked={seriesKind === option}
                        onChange={() => setSeriesKind(option)}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
                <p className={uiStyles.hint}>Single choice within the group.</p>
              </div>
            </div>

            <div className={arcticStyles.card}>
              <div className={uiStyles.card_pad}>
                <h3>Tooltip</h3>
                <p>
                  Grid step follows the{" "}
                  <span className={uiStyles.tooltip_wrap}>
                    <button type="button" data-testid="control-tooltip" className={uiStyles.tooltip_target}>
                      active scale
                    </button>
                    <span role="tooltip" className={uiStyles.tooltip_bubble}>
                      Linear steps by 1, log steps by ×10.
                    </span>
                  </span>
                  .
                </p>
                <p className={uiStyles.hint}>Hover or keyboard-focus the highlighted text.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={uiStyles.section}>
          <h2>Input</h2>
          <div className={uiStyles.card_grid}>
            <div className={arcticStyles.card}>
              <div className={uiStyles.card_pad}>
                <h3>Text input</h3>
                <label className={uiStyles.label} htmlFor="ui-label">
                  Series label
                </label>
                <input
                  id="ui-label"
                  type="text"
                  data-testid="control-label"
                  className={`${arcticStyles.input} ${uiStyles.field_control}`}
                  value={label}
                  onChange={(event) => setLabel(event.currentTarget.value)}
                  placeholder="Name this series"
                />
                <p className={uiStyles.hint}>{label.length} characters.</p>
              </div>
            </div>

            <div className={arcticStyles.card}>
              <div className={uiStyles.card_pad}>
                <h3>Slider</h3>
                <label className={uiStyles.label} htmlFor="ui-detail">
                  Detail level
                </label>
                <input
                  id="ui-detail"
                  type="range"
                  data-testid="control-slider"
                  className={uiStyles.slider}
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue}
                  onChange={(event) => setSliderValue(event.currentTarget.valueAsNumber)}
                />
                <p className={uiStyles.hint}>Current value: {sliderValue}.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={`${uiStyles.section} ${uiStyles.section_alt}`}>
          <h2>Actions</h2>
          <div className={uiStyles.card_grid}>
            <div className={arcticStyles.card}>
              <div className={uiStyles.card_pad}>
                <h3>Button variants</h3>
                <div className={uiStyles.button_row}>
                  {BUTTON_VARIANTS.map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      data-testid={`control-button-${variant.toLowerCase()}`}
                      className={buttonClass(variant)}
                      onClick={() => handleButtonClick(variant)}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
                <p className={uiStyles.hint}>Each click reports into the live state readout.</p>
              </div>
            </div>

            <div className={arcticStyles.card}>
              <div className={uiStyles.card_pad}>
                <h3>Toggle and checkbox</h3>
                <div className={uiStyles.toggle_stack}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={gridOn}
                    data-testid="control-toggle"
                    className={gridOn ? `${uiStyles.switch} ${uiStyles.switch_on}` : uiStyles.switch}
                    onClick={() => setGridOn((on) => !on)}
                  >
                    <span className={uiStyles.switch_knob} />
                    <span className={uiStyles.switch_text}>Grid {gridOn ? "on" : "off"}</span>
                  </button>
                  <label className={uiStyles.check_label}>
                    <input
                      type="checkbox"
                      data-testid="control-legend"
                      className={uiStyles.check}
                      checked={showLegend}
                      onChange={(event) => setShowLegend(event.currentTarget.checked)}
                    />
                    Show legend
                  </label>
                </div>
                <p className={uiStyles.hint}>Switch is a button, legend is a native checkbox.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
