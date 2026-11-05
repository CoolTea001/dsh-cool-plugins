/**
 * The copy of the sidebar entry, the Daily Post page, and its settings dialog,
 * in the two locales DSH ships.
 *
 * The two dictionaries must carry exactly the same keys: `zh` is typed as
 * `typeof en`, so a key added to one and forgotten in the other is a compile
 * error rather than a page that falls back mid-sentence.
 */
/** The dictionary namespace this plugin owns. */
export declare const NS = "coolDaily";
/** The translate seat the sidebar label and the page draw through. */
export type Translate = (key: string) => string;
/** The English copy, which is also the fallback every lookup ends at. */
export declare const en: {
    panel: string;
    'page.description': string;
    'search.placeholder': string;
    'categories.all': string;
    'categories.label': string;
    'categories.unknown': string;
    'generate.action': string;
    'generate.running': string;
    'settings.action': string;
    'settings.title': string;
    'settings.description': string;
    'settings.prompt': string;
    'settings.promptHint': string;
    'settings.count': string;
    'settings.days': string;
    'settings.cancel': string;
    'settings.close': string;
    'settings.save': string;
    'settings.saving': string;
    'settings.failed': string;
    'list.emptyTitle': string;
    'list.emptyHint': string;
    'list.noMatchTitle': string;
    'list.noMatchHint': string;
    'article.back': string;
    'article.loading': string;
    'article.missing': string;
    'article.retry': string;
    'state.loading': string;
    'state.error': string;
    'state.retry': string;
    'weekday.0': string;
    'weekday.1': string;
    'weekday.2': string;
    'weekday.3': string;
    'weekday.4': string;
    'weekday.5': string;
    'weekday.6': string;
};
/** The Chinese copy, key for key the same page. */
export declare const zh: typeof en;
//# sourceMappingURL=locales.d.ts.map