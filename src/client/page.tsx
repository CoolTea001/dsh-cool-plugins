/**
 * The Daily Post page.
 *
 * The page is a thin, honest projection of the Host's state: it lists the
 * Markdown files the Host has written, filters them locally, and follows a
 * running generation by polling the state route while the Host reports one. It
 * never writes an article itself — the manual button only asks the Host to start
 * a batch, and the settings dialog only stores the prompt, batch size, and
 * repeat days the Host schedules from.
 */

import * as React from 'react'
import { Pill, Tag } from '@deepseek-ai/dsh-client-ui-primitives'

import { fetchState, startGeneration } from './api.js'
import { ArticleView } from './article.js'
import { DocIcon, SearchIcon, SettingsIcon, SparkleIcon } from './icons.js'
import type { Translate } from './locales.js'
import { SettingsDialog } from './settings.js'
import type { ArticleSummary, DailySettings, DailyStatePayload } from '../shared/contract.js'

/** The props the shell hands a root-scoped main panel whose registration names this locale. */
export interface DailyPageProps {
  /** The plugin's translate seat, read at render time so a language switch re-renders. */
  t: Translate
}

/** The two views the page swaps between. */
type View = { kind: 'list' } | { kind: 'article'; id: string }

/** How often a running generation is polled, in milliseconds. */
const POLL_INTERVAL_MS = 2500

/**
 * Render one article card.
 * @param props - the article summary and the open action.
 * @returns the list row.
 */
function ArticleCard({ article, onOpen }: { article: ArticleSummary; onOpen: () => void }): React.ReactElement {
  return (
    <button type="button" className="dsh-cd-card" onClick={onOpen}>
      <span className="dsh-cd-card-top">
        <Tag tone="neutral">{article.category}</Tag>
        <span className="dsh-cd-date">{article.date}</span>
      </span>
      <span className="dsh-cd-card-title">{article.title}</span>
      {article.excerpt !== '' && <span className="dsh-cd-card-excerpt">{article.excerpt}</span>}
    </button>
  )
}

/**
 * Render the Daily Post page.
 * @param props - the plugin's translate seat.
 * @returns the page frame: heading, toolbar, article list, and the reader.
 */
export function DailyPage({ t }: DailyPageProps): React.ReactElement {
  const [state, setState] = React.useState<DailyStatePayload | null>(null)
  const [view, setView] = React.useState<View>({ kind: 'list' })
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  // Opening an article or coming back starts at the top: the reader and the
  // list share one scrolling region, so without this the new view inherits the
  // old scroll position.
  React.useEffect(() => {
    if (scrollRef.current !== null) scrollRef.current.scrollTop = 0
  }, [view])

  const refresh = React.useCallback(async (): Promise<void> => {
    const answer = await fetchState()
    if (answer.ok === true) {
      setState(answer)
      setLoadError(null)
    } else {
      setLoadError(answer.error)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const generating = state?.generating === true

  // While a batch runs, the page follows it instead of leaving the user with a
  // stale list: the Host clears `generating` when the batch settles, and this
  // effect stops polling at the same moment.
  React.useEffect(() => {
    if (!generating) return
    const timer = window.setInterval(() => { void refresh() }, POLL_INTERVAL_MS)
    return () => { window.clearInterval(timer) }
  }, [generating, refresh])

  const categories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const article of state?.articles ?? []) {
      counts.set(article.category, (counts.get(article.category) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([name]) => name)
  }, [state])

  const articles = React.useMemo(() => {
    const text = query.trim().toLowerCase()
    return (state?.articles ?? []).filter((article) => {
      if (category !== '' && article.category !== category) return false
      if (text === '') return true
      return article.title.toLowerCase().includes(text)
        || article.excerpt.toLowerCase().includes(text)
        || article.category.toLowerCase().includes(text)
    })
  }, [state, category, query])

  const generate = async (): Promise<void> => {
    if (generating || busy) return
    setBusy(true)
    const answer = await startGeneration()
    setBusy(false)
    if (answer.ok !== true) {
      setLoadError(answer.error)
      return
    }
    setState(current => current === null ? current : { ...current, generating: true, lastError: null })
    void refresh()
  }

  const onSaved = (settings: DailySettings): void => {
    setSettingsOpen(false)
    setState(current => current === null ? current : { ...current, settings })
  }

  const reading = view.kind === 'article'
  const status = loadError !== null
    ? `${t('state.error')}${loadError === '' ? '' : ` (${loadError})`}`
    : state?.lastError ?? null

  return (
    <section className="dsh-cd-page" aria-labelledby={reading ? undefined : 'dsh-cd-title'}>
      <div className="dsh-cd-scroll" ref={scrollRef}>
        <div className="dsh-cd-content">
          {reading ? (
            <ArticleView t={t} id={view.id} onBack={() => { setView({ kind: 'list' }) }} />
          ) : (
            <>
              <header className="dsh-cd-head">
                <div className="dsh-cd-head-copy">
                  <h1 id="dsh-cd-title" className="dsh-cd-title" tabIndex={-1}>
                    {t('panel')}
                  </h1>
                  <p className="dsh-cd-description">{t('page.description')}</p>
                </div>
                <div className="dsh-cd-actions">
                  <button
                    type="button"
                    className="dsh-cd-btn"
                    onClick={() => { setSettingsOpen(true) }}
                    disabled={state === null}
                  >
                    <SettingsIcon size={15} />
                    {t('settings.action')}
                  </button>
                  <button
                    type="button"
                    className="dsh-cd-btn dsh-cd-btn-primary"
                    onClick={() => { void generate() }}
                    disabled={generating || busy || state === null}
                  >
                    <SparkleIcon size={15} className={generating ? 'dsh-cd-spin' : undefined} />
                    {generating ? t('generate.running') : t('generate.action')}
                  </button>
                </div>
              </header>

              {status !== null && (
                <div className="dsh-cd-banner dsh-cd-banner-error" role="alert">
                  <span>{status}</span>
                  <button
                    type="button"
                    className="dsh-cd-link"
                    onClick={() => { void (loadError === null ? generate() : refresh()) }}
                  >
                    {t('state.retry')}
                  </button>
                </div>
              )}

              <div className="dsh-cd-toolbar">
                <label className="dsh-cd-search">
                  <SearchIcon size={15} className="dsh-cd-search-icon" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => { setQuery(event.target.value) }}
                    placeholder={t('search.placeholder')}
                    aria-label={t('search.placeholder')}
                  />
                </label>
                {categories.length > 0 && (
                  <div className="dsh-cd-badges" role="group" aria-label={t('categories.label')}>
                    <Pill
                      active={category === ''}
                      aria-pressed={category === ''}
                      onClick={() => { setCategory('') }}
                    >
                      {t('categories.all')}
                    </Pill>
                    {categories.map(name => (
                      <Pill
                        key={name}
                        active={category === name}
                        aria-pressed={category === name}
                        onClick={() => { setCategory(category === name ? '' : name) }}
                      >
                        {name}
                      </Pill>
                    ))}
                  </div>
                )}
              </div>

              {state === null && loadError === null && <p className="dsh-cd-state">{t('state.loading')}</p>}

              {state !== null && articles.length === 0 && (
                <div className="dsh-cd-empty">
                  <span className="dsh-cd-empty-icon">
                    <DocIcon size={24} />
                  </span>
                  <p className="dsh-cd-empty-title">
                    {state.articles.length === 0 ? t('list.emptyTitle') : t('list.noMatchTitle')}
                  </p>
                  <p className="dsh-cd-empty-hint">
                    {state.articles.length === 0 ? t('list.emptyHint') : t('list.noMatchHint')}
                  </p>
                </div>
              )}

              {articles.length > 0 && (
                <div className="dsh-cd-list">
                  {articles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onOpen={() => { setView({ kind: 'article', id: article.id }) }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {settingsOpen && state !== null && (
        <SettingsDialog
          t={t}
          settings={state.settings}
          onClose={() => { setSettingsOpen(false) }}
          onSaved={onSaved}
        />
      )}
    </section>
  )
}
