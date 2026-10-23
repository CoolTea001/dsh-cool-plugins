/**
 * The confirmation's copy, in the two locales DSH ships.
 *
 * Every sentence the dialog draws lives here rather than at the point it is
 * drawn, for two reasons. The page is what knows the language to read in — the
 * Host does not — so a refusal reaches it as a code (see `shared/contract.ts`)
 * and is worded from the `error.<code>` entry below; and the locale service
 * re-renders the dialog when the language is switched, which only works if the
 * copy is looked up at render time through the `t` seat rather than captured in
 * a constant.
 *
 * The two dictionaries must carry exactly the same keys: `zh` is typed as
 * `typeof en`, so a key added to one and forgotten in the other is a compile
 * error rather than a dialog that falls back mid-sentence.
 *
 * Count-bearing sentences come in the `.one` / `.other` pair the shipped
 * dictionaries use. The locale service interpolates `{name}` placeholders but
 * does not choose plural forms, so the caller picks the spelling from the count
 * through {@link countKey}; Chinese spells both variants the same way.
 */
import type { FailureCode } from '../shared/contract.js';
/** The dictionary namespace this page owns. */
export declare const NS = "coolSession";
/**
 * The messages whose wording follows a count.
 *
 * Each base owns a `.one` and an `.other` entry; nothing else may be drawn from
 * it, so a missing plural spelling is a compile error like any other key.
 */
export type PluralBase = 'sessions.bulkPartial' | 'sessions.bulkStopped' | 'sessions.bulkArchivePartial' | 'sessions.bulkArchiveFailed' | 'sessions.activitySubagents' | 'sessions.activityJobs' | 'sessions.activitySchedules' | 'sessions.activityOther';
/** The copy of the menu row, the Settings page, the confirmations, and their refusals. */
type UiKey = 
/** The native Session menu's row. */
'action.delete'
/** The Settings navigation entry and the page behind it. */
 | 'settings.nav' | 'settings.title' | 'settings.description'
/** The management panel's controls. */
 | 'sessions.search' | 'sessions.searchPlaceholder' | 'sessions.allWorkspaces' | 'sessions.noWorkspace' | 'sessions.allSessions' | 'sessions.unarchived' | 'sessions.archived' | 'sessions.running' | 'sessions.selectAll' | 'sessions.selectOne' | 'sessions.archiveSelected' | 'sessions.deleteSelected' | 'sessions.selectedCount' | 'sessions.columnTitle' | 'sessions.columnStatus' | 'sessions.columnActions' | 'sessions.archive' | 'sessions.unarchive' | 'sessions.delete'
/** The management panel's list states. */
 | 'sessions.loading' | 'sessions.empty' | 'sessions.noMatches' | 'sessions.loadFailed' | 'sessions.retry' | 'sessions.unavailable' | 'sessions.actionFailed'
/** The panel's delete confirmation. */
 | 'sessions.deleteSelectedTitle' | 'sessions.deleteBatchDescription'
/** The panel's stop-and-archive confirmation. */
 | 'sessions.archiveStopTitle' | 'sessions.archiveStopDescription' | 'sessions.archiveActivity' | 'sessions.activityTurn' | 'sessions.archiveStopAction' | 'sessions.archiveStopPending'
/** The count-bearing messages, in their singular and plural spellings. */
 | `${PluralBase}.one` | `${PluralBase}.other`
/** The native menu's confirmation and both dialogs' buttons. */
 | 'action.cancel' | 'action.close' | 'delete.title' | 'delete.description' | 'delete.pending' | 'delete.confirm'
/** A Host half that has not reloaded the new delete route yet. */
 | 'error.host-stale';
/** Every key the page draws from, including the refusal codes. */
export type MessageKey = UiKey | `error.${FailureCode}`;
/**
 * The translate seat the page draws through.
 *
 * A key and its placeholder values, read at call time: the function a locale
 * switch hands out is a new one, which is what re-renders the dialog.
 */
export type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;
/**
 * Pick the singular or plural spelling of a count-bearing message.
 *
 * @param base - the message family, whose `.one` and `.other` entries exist.
 * @param count - the number the sentence reports.
 * @returns the key to translate.
 */
export declare function countKey(base: PluralBase, count: number): MessageKey;
/** The English copy, which is also the fallback every lookup ends at. */
export declare const en: {
    'action.delete': string;
    'action.cancel': string;
    'action.close': string;
    'settings.nav': string;
    'settings.title': string;
    'settings.description': string;
    'sessions.search': string;
    'sessions.searchPlaceholder': string;
    'sessions.allWorkspaces': string;
    'sessions.noWorkspace': string;
    'sessions.allSessions': string;
    'sessions.unarchived': string;
    'sessions.archived': string;
    'sessions.running': string;
    'sessions.selectAll': string;
    'sessions.selectOne': string;
    'sessions.archiveSelected': string;
    'sessions.deleteSelected': string;
    'sessions.selectedCount': string;
    'sessions.columnTitle': string;
    'sessions.columnStatus': string;
    'sessions.columnActions': string;
    'sessions.archive': string;
    'sessions.unarchive': string;
    'sessions.delete': string;
    'sessions.loading': string;
    'sessions.empty': string;
    'sessions.noMatches': string;
    'sessions.loadFailed': string;
    'sessions.retry': string;
    'sessions.unavailable': string;
    'sessions.actionFailed': string;
    'sessions.bulkPartial.one': string;
    'sessions.bulkPartial.other': string;
    'sessions.bulkStopped.one': string;
    'sessions.bulkStopped.other': string;
    'sessions.bulkArchivePartial.one': string;
    'sessions.bulkArchivePartial.other': string;
    'sessions.bulkArchiveFailed.one': string;
    'sessions.bulkArchiveFailed.other': string;
    'sessions.deleteSelectedTitle': string;
    'sessions.deleteBatchDescription': string;
    'sessions.archiveStopTitle': string;
    'sessions.archiveStopDescription': string;
    'sessions.archiveActivity': string;
    'sessions.activityTurn': string;
    'sessions.activitySubagents.one': string;
    'sessions.activitySubagents.other': string;
    'sessions.activityJobs.one': string;
    'sessions.activityJobs.other': string;
    'sessions.activitySchedules.one': string;
    'sessions.activitySchedules.other': string;
    'sessions.activityOther.one': string;
    'sessions.activityOther.other': string;
    'sessions.archiveStopAction': string;
    'sessions.archiveStopPending': string;
    'delete.title': string;
    'delete.description': string;
    'delete.pending': string;
    'delete.confirm': string;
    'error.host-stale': string;
    'error.missing-session': string;
    'error.unknown-session': string;
    'error.subagent-delete': string;
    'error.delete-failed': string;
    'error.delete-unsupported': string;
    'error.delete-active': string;
    'error.session-live': string;
    'error.delete-partial': string;
};
/** The Chinese copy, key for key the same page. */
export declare const zh: typeof en;
export {};
//# sourceMappingURL=locales.d.ts.map