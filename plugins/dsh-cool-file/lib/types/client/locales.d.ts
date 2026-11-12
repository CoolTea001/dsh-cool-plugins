/**
 * The Files tab's copy, in the two locales DSH ships.
 *
 * The locale service re-renders the tab when the language is switched, which
 * only works if the copy is looked up at render time through the `t` seat rather
 * than captured in a constant. Placeholders are `{name}` and are filled by the
 * locale service; the two dictionaries must carry exactly the same keys, and
 * `zh` is typed as `typeof en` so a key forgotten in one is a compile error.
 */
/** The dictionary namespace this page owns. */
export declare const NS = "coolFile";
/** The copy the page draws. */
declare const en: {
    /** The tab's own name in the session's tab bar. */
    'view.files': string;
    'side.root': string;
    'side.empty': string;
    'side.error': string;
    'side.loading': string;
    'side.truncated': string;
    'side.filtered': string;
    'action.refresh': string;
    'action.toggleHidden': string;
    'mode.label': string;
    'mode.preview': string;
    'mode.editor': string;
    'preview.empty': string;
    'preview.emptyHint': string;
    'preview.loading': string;
    'preview.lines': string;
    'preview.truncated': string;
    'editor.loading': string;
    'editor.error': string;
    'editor.tooLarge': string;
    'editor.notText': string;
    'editor.missing': string;
    'editor.unsaved': string;
    'editor.stale': string;
    'editor.saveFailed': string;
    'editor.reload': string;
    'editor.plain': string;
    'error.read': string;
};
/** The Chinese copy, key for key the same page. */
export declare const zh: typeof en;
/** Every key the page can draw. */
export type MessageKey = keyof typeof en;
/**
 * The translate seat the page draws through.
 *
 * A key and its placeholder values, read at call time: the function a locale
 * switch hands out is a new one, which is what re-renders the tab.
 */
export type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;
export { en };
//# sourceMappingURL=locales.d.ts.map