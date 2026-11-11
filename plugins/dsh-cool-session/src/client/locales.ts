/**
 * Locale entry point for the Sessions page and its two confirmations.
 *
 * One file per language in `locales/`, this module only re-exports them, names
 * the id union, and derives the message key union the rest of the package draws
 * through. Every sentence the plugin shows lives in a dictionary rather than at
 * the point it is drawn, for two reasons. The page is what knows the language
 * to read in — the Host does not — so a refusal reaches it as a code (see
 * `shared/contract.ts`) and is worded from the `error.<code>` entry below; and
 * the locale service re-renders the page when the language is switched, which
 * only works if the copy is looked up at render time through the `t` seat
 * rather than captured in a constant.
 *
 * The ids are the shell's own (`zh`, `en`, `ja`, `es`, `fr`, `de`, `ru`, `pt`),
 * so a language picked in Settings reaches this page without a mapping table.
 * `zh` and `en` are the locale service's required baselines; the rest are
 * optional ids, each still checked against this same key union — a key added to
 * one dictionary and forgotten in another is a compile error, which is the
 * point: a missing translation is a build error, not a key name on screen.
 *
 * Count-bearing sentences come in the `.one` / `.other` pair the shipped
 * dictionaries use. The locale service interpolates `{name}` placeholders but
 * does not choose plural forms, so the caller picks the spelling from the count
 * through {@link countKey}; the dictionaries that do not inflect for number
 * spell both variants the same way.
 */

import type { FailureCode } from '../shared/contract.js'
import { zh } from './locales/zh.js'
import { en } from './locales/en.js'
import { ja } from './locales/ja.js'
import { es } from './locales/es.js'
import { fr } from './locales/fr.js'
import { de } from './locales/de.js'
import { ru } from './locales/ru.js'
import { pt } from './locales/pt.js'

export { zh, en, ja, es, fr, de, ru, pt }

/** The dictionary namespace this page owns. */
export const NS = 'coolSession'

/** One locale id this package translates. */
export type LocaleId = 'zh' | 'en' | 'ja' | 'es' | 'fr' | 'de' | 'ru' | 'pt'

/** Every dictionary, in the shape the locale service registers. */
export const DICTIONARIES = { zh, en, ja, es, fr, de, ru, pt }

/**
 * The messages whose wording follows a count.
 *
 * Each base owns a `.one` and a `.other` entry; nothing else may be drawn from
 * it, so a missing plural spelling is a compile error like any other key.
 */
export type PluralBase =
  | 'sessions.bulkPartial'
  | 'sessions.bulkStopped'
  | 'sessions.bulkArchivePartial'
  | 'sessions.bulkArchiveFailed'
  | 'sessions.activitySubagents'
  | 'sessions.activityJobs'
  | 'sessions.activitySchedules'
  | 'sessions.activityOther'

/** The copy of the menu row, the Settings page, the confirmations, and their refusals. */
type UiKey =
  /** The native Session menu's row. */
  | 'action.delete'
  /** The Settings navigation entry and the page behind it. */
  | 'settings.nav'
  | 'settings.title'
  | 'settings.description'
  /** The management panel's controls. */
  | 'sessions.search'
  | 'sessions.searchPlaceholder'
  | 'sessions.allWorkspaces'
  | 'sessions.noWorkspace'
  | 'sessions.allSessions'
  | 'sessions.unarchived'
  | 'sessions.archived'
  | 'sessions.running'
  | 'sessions.selectAll'
  | 'sessions.selectOne'
  | 'sessions.archiveSelected'
  | 'sessions.deleteSelected'
  | 'sessions.selectedCount'
  | 'sessions.columnTitle'
  | 'sessions.columnStatus'
  | 'sessions.columnActions'
  | 'sessions.archive'
  | 'sessions.unarchive'
  | 'sessions.delete'
  /** The management panel's list states. */
  | 'sessions.loading'
  | 'sessions.empty'
  | 'sessions.noMatches'
  | 'sessions.loadFailed'
  | 'sessions.retry'
  | 'sessions.unavailable'
  | 'sessions.actionFailed'
  /** The panel's delete confirmation. */
  | 'sessions.deleteSelectedTitle'
  | 'sessions.deleteBatchDescription'
  /** The panel's stop-and-archive confirmation. */
  | 'sessions.archiveStopTitle'
  | 'sessions.archiveStopDescription'
  | 'sessions.archiveActivity'
  | 'sessions.activityTurn'
  | 'sessions.archiveStopAction'
  | 'sessions.archiveStopPending'
  /** The count-bearing messages, in their singular and plural spellings. */
  | `${PluralBase}.one`
  | `${PluralBase}.other`
  /** The native menu's confirmation and both dialogs' buttons. */
  | 'action.cancel'
  | 'action.close'
  | 'delete.title'
  | 'delete.description'
  | 'delete.pending'
  | 'delete.confirm'
  /** A Host half that has not reloaded the new delete route yet. */
  | 'error.host-stale'
  /**
   * The work families a still-running refusal names.
   *
   * The Host sends provider identifiers (`turn`, `subagent`, `job`,
   * `schedule`), not prose, so the page words them here; `activity.separator`
   * is the list punctuation the language uses.
   */
  | 'activity.turn'
  | 'activity.subagent'
  | 'activity.job'
  | 'activity.schedule'
  | 'activity.separator'
  /** The phrase a refusal falls back to when it named no readable kind. */
  | 'error.activityFallback'

/** Every key the page draws from, including the refusal codes. */
export type MessageKey = UiKey | `error.${FailureCode}`

/** The translate seat the page draws through. */
export type Translate = (
  key: MessageKey,
  params?: Readonly<Record<string, string | number>>,
) => string

/**
 * Pick the singular or plural spelling of a count-bearing message.
 *
 * @param base - the message family, whose `.one` and `.other` entries exist.
 * @param count - the number the sentence reports.
 * @returns the key to translate.
 */
export function countKey(base: PluralBase, count: number): MessageKey {
  return `${base}.${count === 1 ? 'one' : 'other'}` as MessageKey
}

/**
 * Every spelling of the Settings navigation label this package ships.
 *
 * The Settings navigation glyph is patched by matching the rendered label, and
 * the shell's CSS module class names rotate between releases, so the label is
 * the only stable handle on that cell. A language switch can land between
 * registration and that read, so the set covers all eight dictionaries rather
 * than only the active one.
 *
 * @returns the distinct navigation labels, in dictionary order.
 */
export function navLabels(): readonly string[] {
  return [...new Set(Object.values(DICTIONARIES).map(dict => dict['settings.nav']))]
}
