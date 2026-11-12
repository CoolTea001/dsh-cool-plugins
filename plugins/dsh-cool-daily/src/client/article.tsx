/**
 * The article reader.
 *
 * One article is fetched by id when the reader opens, so the list payload stays
 * small however many days the directory holds. The Markdown body renders through
 * the plugin's own renderer — React elements, never injected HTML.
 */

import * as React from 'react'
import { IconArrowLeft } from '@dsh-cool/icons'
import { Tag } from '@deepseek-ai/dsh-client-ui-primitives'

import { fetchArticle } from './api.js'
import type { Translate } from './locales.js'
import { Markdown } from './markdown.js'
import type { ArticleDetail } from '../shared/contract.js'

/** The props the page hands the reader. */
export interface ArticleViewProps {
  /** The plugin's translate seat. */
  t: Translate
  /** The article to read. */
  id: string
  /** Return to the list. */
  onBack: () => void
}

/**
 * Render one article.
 * @param props - article id and the back action.
 * @returns the article header, metadata, and rendered body.
 */
export function ArticleView({ t, id, onBack }: ArticleViewProps): React.ReactElement {
  const [article, setArticle] = React.useState<ArticleDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    const answer = await fetchArticle(id)
    if (answer.ok === true) {
      setArticle(answer.article)
      setError(null)
    } else {
      setArticle(null)
      setError(answer.error)
    }
    setLoading(false)
  }, [id])

  React.useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="dsh-cd-article">
      {/* Icon-only: the row is punctuation, not a destination the reader needs
          spelled out. The wording survives as the accessible name and the native
          tooltip, so the control still says what it does to anyone who asks. */}
      <button
        type="button"
        className="dsh-cd-back"
        onClick={onBack}
        aria-label={t('article.back')}
        title={t('article.back')}
      >
        <IconArrowLeft size={16} />
      </button>

      {loading && <p className="dsh-cd-state">{t('article.loading')}</p>}

      {!loading && error !== null && (
        <div className="dsh-cd-state">
          <p>{t('article.missing')}</p>
          <button type="button" className="dsh-cd-btn" onClick={() => { void load() }}>
            {t('article.retry')}
          </button>
        </div>
      )}

      {!loading && article !== null && (
        <article>
          <header className="dsh-cd-article-head">
            <h1 className="dsh-cd-article-title">{article.title}</h1>
            <div className="dsh-cd-article-meta">
              <span>{article.date}</span>
              <Tag tone="neutral">{article.category}</Tag>
            </div>
            {article.tags.length > 0 && (
              <div className="dsh-cd-article-tags" role="group" aria-label={t('tags.label')}>
                {article.tags.map(tag => (
                  <Tag key={tag} tone="outline">{tag}</Tag>
                ))}
              </div>
            )}
          </header>
          <Markdown text={article.content} />
        </article>
      )}
    </div>
  )
}
