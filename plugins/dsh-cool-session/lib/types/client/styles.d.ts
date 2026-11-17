/**
 * Package-owned stylesheet for the plugin's three surfaces.
 *
 * The native Session menu row and both confirmations are drawn by DSH's own
 * primitives, so this sheet only adds the danger tint on the legacy menu row and
 * on the dialogs' confirm action, the inline refusal blocks, and the Settings
 * page's own controls and table. (Where the menu service carries Delete, its
 * `danger` flag supplies the red row instead.) The section follows the shipped
 * sections' heading and row rhythm. Every color is a `--dsw-*` theme token, so
 * every surface follows the active light or dark appearance — including
 * third-party theme presets — instead of forcing a palette of its own.
 */
/**
 * Insert this package's rules — and the shared ones — once for the plugin lifetime.
 *
 * The tag's ownership record, and why it matters, are `@dsh-cool/ui`'s business
 * rather than this file's: see `insertPluginStyles`. What stays here is the
 * plugin's own id, which is the name that ownership record carries.
 *
 * @returns disposer that removes exactly this sheet.
 */
export declare function insertStyles(): () => void;
//# sourceMappingURL=styles.d.ts.map