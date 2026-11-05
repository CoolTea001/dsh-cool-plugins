/**
 * The wire contract shared by both halves of dsh-cool-daily.
 *
 * The Host owns every durable value: the settings file, the article directory,
 * and the model call that fills it. The browser half only ever sees these
 * detached records, so this module is the one place where a field may be added
 * without the two sides drifting.
 */

/** One article as the list needs it: everything except the Markdown body. */
export interface ArticleSummary {
  /** Stable id, equal to the Markdown file's name without its extension. */
  id: string
  /** Display title, from the file's front matter. */
  title: string
  /** Local calendar day the article belongs to, `YYYY-MM-DD`. */
  date: string
  /** Short category label, from the file's front matter. */
  category: string
  /** ISO instant the file was written. */
  createdAt: string
  /** Plain-text opening of the body, for the list card. */
  excerpt: string
}

/** One article with its Markdown body. */
export interface ArticleDetail extends ArticleSummary {
  content: string
}

/** Everything the settings panel may change. */
export interface DailySettings {
  /** The topic instruction the model receives, in the user's own words. */
  prompt: string
  /** Articles requested per generation, 1-10. */
  count: number
  /** Repeat days as `Date#getDay()` values, 0 = Sunday. Empty means manual only. */
  days: number[]
}

/** The state payload the page polls while a generation is running. */
export interface DailyStatePayload {
  ok: true
  settings: DailySettings
  articles: ArticleSummary[]
  generating: boolean
  lastError: string | null
}

/** The settings write answer. */
export interface SettingsPayload {
  ok: true
  settings: DailySettings
}

/** The article read answer. */
export interface ArticlePayload {
  ok: true
  article: ArticleDetail
}

/** Every route below this prefix is owned by this plugin. */
export const API_PREFIX = '/dsh-cool-daily/api'

/** Route paths, kept in one place so both halves address the same surface. */
export const API_PATHS = {
  state: `${API_PREFIX}/state`,
  settings: `${API_PREFIX}/settings`,
  generate: `${API_PREFIX}/generate`,
  article: `${API_PREFIX}/article`,
} as const

/** Oldest hour of the local day at which automatic generation may run. */
export const AUTO_GENERATION_HOUR = 8
