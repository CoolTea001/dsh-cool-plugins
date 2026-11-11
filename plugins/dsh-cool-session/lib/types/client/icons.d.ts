/**
 * The plugin's icon artwork, built from `src/client/assets/*.svg`.
 *
 * The client bundle is one JS file the platform's module loader evaluates, so
 * sibling asset files would never be fetched. tsdown.config.ts reads the artwork
 * at build time and exposes it as the `__DSH_CS_ICONS__` string map this module
 * consumes, keyed by asset filename stem — the arrangement dsh-cool-git uses.
 *
 * dsh-cool-git renders each asset as a React component because those glyphs live
 * in its own trees. This plugin's glyphs have different owners: the Settings
 * navigation cell is shell-owned DOM, so the archive artwork is exposed as the
 * markup the patch writes into that seat (the way dsh-cool-theme installs its
 * palette); the filter caret is drawn by this package's own page, so its markup
 * is embedded the same way inside the trigger. Parsing still happens once, at
 * module evaluation, with the same viewBox/inner split.
 */
/**
 * The Sessions glyph as complete markup for the shell's navigation seat.
 *
 * It carries its own 16px size because the asset's `1em` would resolve against
 * the nav cell's 14px text, and the stroke is `currentColor`, so the glyph takes
 * the label's color in both appearances.
 */
export declare const ARCHIVE_NAV_MARKUP: string;
/**
 * The caret beside the panel's two filter triggers.
 *
 * `assets/arrow-down.svg` strokes with `currentColor`, so the trigger's label
 * color reaches it; the fixed 12px keeps it clear of the control's 13px text.
 */
export declare const ARROW_DOWN_MARKUP: string;
//# sourceMappingURL=icons.d.ts.map