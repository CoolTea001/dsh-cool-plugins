/**
 * The Daily Post page.
 *
 * The page is a thin, honest projection of the Host's state: it lists the
 * Markdown files the Host has written, filters them locally, and follows a
 * running generation by polling the state route while the Host reports one. It
 * never writes an article itself — the manual button only asks the Host to start
 * a batch, and the settings dialog only stores the prompt, batch size, repeat
 * days, and model the Host schedules from.
 */

import * as React from 'react'
import { Pill, Tag } from '@deepseek-ai/dsh-client-ui-primitives'

import { deleteArticle, fetchState, markRead, startGeneration } from './api.js'
import { ArticleView } from './article.js'
import { DeleteDialog } from './delete-dialog.js'
import { ArrowUpIcon, DocIcon, SearchIcon, SettingsIcon, SparkleIcon } from './icons.js'
import type { Translate } from './locales.js'
import { SettingsDialog } from './settings.js'
import { notifyUnreadChanged } from './unread.js'
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
 * How far into an article the reader must be before the back-to-top control
 * appears, in px. Roughly one screen of a 13" display: below that the top of the
 * article is still a glance away and a floating button would only be clutter.
 */
const BACK_TO_TOP_AT = 320

/**
 * Render one article card: the title first, the opening sentence beneath it, and
 * a footer that pairs the content tags with the publication day and the delete
 * control.
 *
 * @param props - the article summary, the plugin's translate seat, and the two actions.
 * @returns the list row.
 */
function ArticleCard({ article, t, onOpen, onDelete }: {
  article: ArticleSummary
  t: Translate
  onOpen: () => void
  onDelete: () => void
}): React.ReactElement {
  // The card is a div rather than a button because the footer carries a second,
  // independent action: a button cannot nest another. The role, the tab stop and
  // the Enter/Space handler keep the whole-card gesture, and the handler ignores
  // keys that bubbled up from the delete control.
  return (
    <div
      className="dsh-cd-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onOpen()
      }}
    >
      <span className="dsh-cd-card-head">
        <span className="dsh-cd-card-title">{article.title}</span>
        {!article.read && <span className="dsh-cd-new">{t('card.new')}</span>}
      </span>
      {article.excerpt !== '' && <span className="dsh-cd-card-excerpt">{article.excerpt}</span>}
      <span className="dsh-cd-card-foot">
        <span className="dsh-cd-card-tags">
          {article.tags.slice(0, 3).map(tag => (
            <Tag key={tag} tone="neutral">{tag}</Tag>
          ))}
        </span>
        <span className="dsh-cd-card-meta">
          <span className="dsh-cd-date">{article.date}</span>
          <button
            type="button"
            className="dsh-cd-delete"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            {t('card.delete')}
          </button>
        </span>
      </span>
    </div>
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
  const [pendingDelete, setPendingDelete] = React.useState<ArticleSummary | null>(null)
  const [deleteBusy, setDeleteBusy] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const scrollWrapRef = React.useRef<HTMLDivElement | null>(null)

  // Opening an article or coming back starts at the top: the reader and the list
  // share one scrolling region, so without this the new view inherits the old
  // scroll position.
  React.useEffect(() => {
    if (scrollRef.current !== null) scrollRef.current.scrollTop = 0
  }, [view])

  // The unread count last seen by this page, so a batch that lands while the
  // page is open can tell the sidebar entry without a state comparison of its own.
  const unreadSeen = React.useRef(0)

  const refresh = React.useCallback(async (): Promise<void> => {
    const answer = await fetchState()
    if (answer.ok === true) {
      setState(answer)
      setLoadError(null)
      const unread = answer.articles.filter(article => !article.read).length
      if (unread !== unreadSeen.current) {
        unreadSeen.current = unread
        notifyUnreadChanged()
      }
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

  /**
   * Show each edge fade only where the scroll region really hides something.
   *
   * Scrolling fires far too often to push this through React state, so the
   * answer is written straight onto the wrapper as `data-fade-top` and
   * `data-fade-bottom`; the stylesheet turns those attributes into the scroller's
   * mask. The same pass records the scrollbar gutter in `--dsh-cd-fade-right`: a
   * mask also applies to the scrollbar, so the sheet lays the fade over the
   * content column and a second, opaque layer over the gutter — without that the
   * bar would be masked away instead of merely left alone.
   * No dependency list: every content change arrives as a commit, and re-running
   * is what re-reads the new heights.
   */
  React.useEffect(() => {
    const scroll = scrollRef.current
    const wrap = scrollWrapRef.current
    if (scroll === null || wrap === null) return
    const update = (): void => {
      const overflow = scroll.scrollHeight - scroll.clientHeight > 1
      wrap.toggleAttribute('data-fade-top', overflow && scroll.scrollTop > 1)
      wrap.toggleAttribute(
        'data-fade-bottom',
        overflow && scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight - 1,
      )
      // Same pass, same reason: the back-to-top control is shown by an
      // attribute instead of a state update, so scrolling never re-renders.
      wrap.toggleAttribute('data-can-top', overflow && scroll.scrollTop > BACK_TO_TOP_AT)
      const gutter = `${scroll.offsetWidth - scroll.clientWidth}px`
      if (wrap.style.getPropertyValue('--dsh-cd-fade-right') !== gutter) {
        wrap.style.setProperty('--dsh-cd-fade-right', gutter)
      }
    }
    update()
    scroll.addEventListener('scroll', update, { passive: true })
    // A box change needs no commit of its own, so it is not something a re-render
    // would pick up — hence the observer, not just `update()`.
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(scroll)
    return () => {
      scroll.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  })

  // Deleting the last article of the selected category would otherwise leave the
  // list filtered by a chip that is no longer offered anywhere.
  React.useEffect(() => {
    if (category === '') return
    if ((state?.articles ?? []).some(article => article.category === category)) return
    setCategory('')
  }, [category, state])

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

  // Opening an article marks it read locally first and tells the Host second, so
  // the list is already consistent when the reader comes back; a failed receipt
  // only means the next state refresh shows it unread again.
  const openArticle = React.useCallback((id: string): void => {
    setView({ kind: 'article', id })
    setState(current => current === null ? current : {
      ...current,
      articles: current.articles.map(article => article.id === id ? { ...article, read: true } : article),
    })
    // The dot in the sidebar entry is drawn from the Host's own answer, so it is
    // told once the receipt lands — not before, when the article still reads as
    // unread there.
    void markRead(id).then(() => { notifyUnreadChanged() })
  }, [])

  /**
   * Return the reading view to its first line.
   *
   * The scroller is the one the article is drawn in, so this is a scroll of the
   * page's own region — not of the window — and it keeps the article view mounted
   * (the reader's place in the list is preserved by the page's own state).
   */
  const scrollToTop = React.useCallback((): void => {
    const scroll = scrollRef.current
    if (scroll === null) return
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    scroll.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  /**
   * Delete the article the confirmation names.
   *
   * The card leaves the list only after the Host answers, so a refused delete
   * keeps the article and its confirmation on screen with the reason.
   */
  const confirmDelete = async (): Promise<void> => {
    const target = pendingDelete
    if (target === null || deleteBusy) return
    setDeleteBusy(true)
    setDeleteError(null)
    const answer = await deleteArticle(target.id)
    setDeleteBusy(false)
    if (answer.ok !== true) {
      setDeleteError(answer.error)
      return
    }
    setPendingDelete(null)
    setState(current => current === null ? current : {
      ...current,
      articles: current.articles.filter(article => article.id !== target.id),
    })
    notifyUnreadChanged()
  }

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
      {reading ? null : (
        <div className="dsh-cd-content dsh-cd-content-head">
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
        </div>
      )}

      <div className="dsh-cd-scroll-wrap" ref={scrollWrapRef}>
        <div className="dsh-cd-scroll" ref={scrollRef}>
          <div className="dsh-cd-content">
            {reading ? (
              <ArticleView t={t} id={view.id} onBack={() => { setView({ kind: 'list' }) }} />
            ) : (
              <>
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
                        t={t}
                        onOpen={() => { openArticle(article.id) }}
                        onDelete={() => {
                          setDeleteError(null)
                          setPendingDelete(article)
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {reading && (
          <button
            type="button"
            className="dsh-cd-totop"
            onClick={scrollToTop}
            aria-label={t('article.top')}
            title={t('article.top')}
          >
            <ArrowUpIcon size={16} />
          </button>
        )}
      </div>

      {pendingDelete !== null && (
        <DeleteDialog
          t={t}
          title={pendingDelete.title}
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => { setPendingDelete(null) }}
          onConfirm={() => { void confirmDelete() }}
        />
      )}

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
