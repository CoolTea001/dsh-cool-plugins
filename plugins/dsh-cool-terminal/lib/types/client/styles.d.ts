/**
 * Package-owned stylesheet for the terminal tab.
 *
 * Colors read the active theme tokens, so the tab follows the appearance the
 * user selected (including third-party theme presets) instead of forcing a
 * fixed dark terminal look. The sidebar mirrors the shipped sidebar's row
 * rhythm (28px headers, 26px rows, 8px radii, hover/active tokens) so the two
 * surfaces read as one product.
 *
 * xterm's own stylesheet is inlined too; it arrives as a build-time `define`
 * (see tsdown.config.ts) because the platform module loader loads this package
 * as a single JS file and would never fetch a sibling `.css` asset.
 */
export declare const TERMINAL_CSS: string;
/**
 * Insert the stylesheet — and the shared one — once for the plugin lifetime.
 *
 * xterm's own sheet is part of this package's rules: the whole point of inlining
 * it is that the console's markup and its styles arrive together.
 *
 * The tag's ownership record, and why it matters, are `@dsh-cool/ui`'s business
 * rather than this file's: see `insertPluginStyles`. This sheet used to carry no
 * `data-plugin` at all, which left it claimable by whichever module materialized
 * next and deletable with it.
 *
 * @returns disposer that removes exactly this sheet.
 */
export declare function insertTerminalStyles(): () => void;
//# sourceMappingURL=styles.d.ts.map