import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { IconSearch } from '../src/index.js'
import * as icons from '../src/index.js'
import type { IconProps } from '../src/icon.js'
import './catalog.css'

interface IconEntry {
  name: string
  fileName: string
  Icon: (props: IconProps) => ReactElement
}

function fileNameOf(name: string): string {
  return `${name
    .replace(/^Icon/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()}.tsx`
}

// The catalog reflects the public barrel: an icon missing from `src/index.ts` is
// missing here too, which is exactly what a consumer can import.
const entries: IconEntry[] = Object.entries(icons)
  .filter(
    ([name, value]) =>
      name !== 'IconBase' &&
      /^Icon[A-Z]/.test(name) &&
      typeof value === 'function',
  )
  .map(([name, Icon]) => ({
    name,
    fileName: fileNameOf(name),
    Icon: Icon as IconEntry['Icon'],
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

function App(): ReactElement {
  const [query, setQuery] = useState('')
  const [columns, setColumns] = useState(0)
  const gridRef = useRef<HTMLUListElement>(null)

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return entries
    return entries.filter(
      ({ name, fileName }) =>
        name.toLowerCase().includes(needle) || fileName.includes(needle),
    )
  }, [query])

  useEffect(() => {
    const grid = gridRef.current
    if (grid === null) return

    const measure = (): void => {
      const template = getComputedStyle(grid).gridTemplateColumns
      const count = template === 'none' ? 0 : template.trim().split(/\s+/).length
      setColumns((current) => (current === count ? current : count))
    }

    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [visible.length])

  const remaining =
    columns > 0 && visible.length % columns !== 0
      ? columns - (visible.length % columns)
      : 0

  const filtered = query.trim() !== ''
  const count = filtered
    ? `${visible.length} of ${entries.length} icons`
    : `${entries.length} icons`
  const sheetStyle = filtered
    ? {
        width: `${Math.max(Math.min(visible.length, 7), 1) * 180 + 2}px`,
        maxWidth: '100%',
      }
    : undefined

  return (
    <div className="catalog">
      <header className="topbar">
        <div className="brand">
          <h1>@dsh-cool/icons</h1>
          <p className="brand-meta" aria-live="polite">
            {count}
          </p>
        </div>

        <label className="search">
          <span className="sr-only">Search icons</span>
          <IconSearch size={14} className="search-icon" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </header>

      <main className="content">
        {visible.length === 0 ? (
          <section className="empty" aria-labelledby="empty-title">
            <span className="empty-icon" aria-hidden="true">
              <IconSearch size={20} />
            </span>
            <h2 id="empty-title">No icons found</h2>
            <p>Nothing matches “{query.trim()}”. Try a component name or file name.</p>
            <button type="button" onClick={() => setQuery('')}>
              Clear search
            </button>
          </section>
        ) : (
          <section
            className="sheet"
            style={sheetStyle}
            aria-label="Icon collection"
          >
            <ul className="icon-grid" ref={gridRef}>
              {visible.map(({ name, fileName, Icon }) => (
                <li className="icon-cell" key={name}>
                  <div className="icon-glyph">
                    <Icon size={24} />
                  </div>
                  <div className="icon-meta">
                    <p className="icon-name">{name}</p>
                    <p className="icon-file">{fileName}</p>
                  </div>
                </li>
              ))}
              {Array.from({ length: remaining }, (_, index) => (
                <li
                  className="icon-cell icon-cell-empty"
                  key={`empty-${index}`}
                  aria-hidden="true"
                />
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}

const root = document.getElementById('root')
if (root === null) throw new Error('catalog: #root is missing')

createRoot(root).render(<App />)
