/**
 * The page: a header, a sidebar of components, and the selected one's preview.
 *
 * Three regions and no more. The catalog answers one question — what does this
 * component look like, and what can I pass it — and every extra region (a search
 * box, a theme switch, a filter row) is a second question the reader did not ask.
 * The icon catalog made the same trade: it is a header and a wall of glyphs.
 *
 * One flat list, ordered by name. The components split into three kinds — the
 * ones this package draws (`own.tsx`), the shell controls a plugin reaches for
 * first (`shell.tsx`), and the rest of the shell's atoms (`more.tsx`) — but a
 * reader looks a component up by its name, not by who owns it, so the split
 * earns a heading only in the entry's own source line. Alphabetical order is the
 * one ordering a reader can predict without knowing how the package is
 * organised.
 *
 * The selection lives in the URL hash, because a catalog is something a reader
 * links to: "look at the panel's shaded edge" should be one click away for the
 * next person, and a hash needs no router.
 */

import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { SHELL_ENTRIES } from './shell.js'
import { MORE_ENTRIES } from './more.js'
import { OWN_ENTRIES } from './own.js'
import type { CatalogEntry } from './types.js'
import { PropsTable } from './ui.js'

/** Every entry, in the one order the sidebar shows and nothing else depends on. */
const ALL: readonly CatalogEntry[] = [...OWN_ENTRIES, ...SHELL_ENTRIES, ...MORE_ENTRIES].sort((left, right) =>
  left.name.localeCompare(right.name, 'en'),
)

/** The id the first frame selects when the URL names nothing usable. */
const FALLBACK_ID = ALL[0]?.id ?? ''

/**
 * Read the entry id out of the URL hash.
 *
 * @returns the id the hash names, or the fallback when it names nothing.
 */
function readHash(): string {
  const id = window.location.hash.replace(/^#/, '')
  return ALL.some((entry) => entry.id === id) ? id : FALLBACK_ID
}

function App(): ReactElement {
  const [selected, setSelected] = useState<string>(readHash)

  // Two directions, one source: a click writes the hash, and a hash the reader
  // arrives with (a link, a Back press) selects the entry it names.
  useEffect(() => {
    const sync = (): void => { setSelected(readHash()) }
    window.addEventListener('hashchange', sync)
    return () => { window.removeEventListener('hashchange', sync) }
  }, [])

  const entry = useMemo(
    () => ALL.find((candidate) => candidate.id === selected) ?? ALL[0],
    [selected],
  )

  const select = (id: string): void => {
    setSelected(id)
    window.location.hash = id
  }

  if (entry === undefined) return <p className="empty">No components.</p>

  const { Demo } = entry

  return (
    <div className="catalog">
      <header className="topbar">
        <div className="topbar-lead">
          <h1 className="brand">@dsh-cool/ui</h1>
          <p className="brand-meta" aria-live="polite">
            {ALL.length} components
          </p>
        </div>
      </header>

      <div className="body">
        <nav className="sidebar" aria-label="Components">
          <ul className="nav-list">
            {ALL.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="nav-item"
                  aria-current={item.id === entry.id ? 'page' : undefined}
                  onClick={() => { select(item.id) }}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="preview" key={entry.id}>
          <div className="preview-head">
            <h2 className="preview-title">{entry.name}</h2>
            <p className="preview-summary">{entry.summary}</p>
            <p className="preview-file">
              <code>{entry.file}</code>
            </p>
          </div>
          <Demo />
          <PropsTable rows={entry.props} />
        </main>
      </div>
    </div>
  )
}

export { App }
