/**
 * Package-owned stylesheet for the Daily Post page.
 *
 * The sheet follows the shipped first-level pages' frame — the same centered
 * column, first-level heading, and macOS hiddenInset titlebar clearance — so
 * this panel sits beside Plugins and Automated Tasks without looking like a
 * different surface. Every color is a `--dsw-*` theme token, so the page follows
 * the active light or dark appearance, including third-party theme presets,
 * instead of forcing a palette of its own.
 */
/**
 * Mount the page's stylesheet for the plugin's lifetime.
 * @returns the disposer that removes the style element.
 */
export declare function insertStyles(): () => void;
//# sourceMappingURL=styles.d.ts.map