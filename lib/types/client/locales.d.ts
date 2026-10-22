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
 */
import type { FailureCode } from '../shared/contract.js';
/** The dictionary namespace this page owns. */
export declare const NS = "coolSession";
/** The copy of the menu row, the Settings section, the confirmation, and its refusals. */
type UiKey = 
/** The native Session menu's row. */
'action.delete'
/** The Settings navigation entry and the page behind it. */
 | 'settings.nav' | 'settings.title' | 'settings.empty'
/** The confirmation's dialog and buttons. */
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
/** The English copy, which is also the fallback every lookup ends at. */
export declare const en: {
    'action.delete': string;
    'action.cancel': string;
    'action.close': string;
    'settings.nav': string;
    'settings.title': string;
    'settings.empty': string;
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