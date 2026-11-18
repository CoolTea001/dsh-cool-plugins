import { createRoot } from 'react-dom/client'
import { ICON_SYMBOLS } from '@deepseek-ai/dsh-client-ui-primitives/src/icons/artwork.ts'
import { insertPluginStyles } from '../src/styles/inject.js'
import { resizablePanelCss } from '../src/layout/resizable-panel-css.js'
import { App } from './app.js'
import { PANEL_DEMO } from './own.js'
import './tokens.css'
import './platform-scrollbar.css'
import './shell.css'
import './catalog.css'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Publish the shell's product icon set as the sprite its icons reference.
 *
 * Every shell icon renders `<use href="#dsw-icon-…">` and draws nothing until
 * the sprite exists — the `ui-theme` plugin normally installs it for the app.
 * A catalog page has no app around it, so it installs the same sprite from the
 * same `ICON_SYMBOLS` map: the artwork is the shell's own, and a themed glyph
 * is out of scope because this page shows one appearance.
 */
function installIconSprite(): void {
  const sprite = document.createElementNS(SVG_NS, 'svg')
  sprite.setAttribute('aria-hidden', 'true')
  sprite.setAttribute('data-dsh-icon-sprite', '')
  sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'

  for (const [id, markup] of Object.entries(ICON_SYMBOLS)) {
    const source = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement
    const symbol = document.createElementNS(SVG_NS, 'symbol')
    for (const { name, value } of source.attributes) {
      // A nested document repeats these; on a symbol they would re-scope the
      // whole sprite or restate the namespace the page already has.
      if (name === 'xmlns' || name.startsWith('xmlns:')) continue
      symbol.setAttribute(name, value)
    }
    symbol.id = id
    symbol.append(...[...source.childNodes].map((node) => document.importNode(node, true)))
    sprite.append(symbol)
  }

  document.body.prepend(sprite)
}

installIconSprite()

// The shared sheet, inserted the way a plugin inserts it — so the page proves
// the one insertion path rather than a copy of it — followed by the geometry the
// resizable-panel demo is drawn from, built by the package's own factory.
insertPluginStyles(
  'dsh-cool-ui-catalog',
  resizablePanelCss('.demo-side', { property: PANEL_DEMO.property, bounds: PANEL_DEMO.bounds }),
)

const root = document.getElementById('root')
if (root === null) throw new Error('catalog: #root is missing')

createRoot(root).render(<App />)
