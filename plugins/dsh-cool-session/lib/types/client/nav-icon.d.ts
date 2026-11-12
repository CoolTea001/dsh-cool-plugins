/**
 * The archive glyph on the Settings panel's Sessions entry.
 *
 * A section registration carries a label, not an icon: the shipped settings
 * shell picks its navigation glyph from the section id (`navIcon(row.id)` in
 * ui-settings-general), and every id it does not know — a plugin's id included —
 * gets the generic gear. The entry therefore owns its glyph the only way a
 * plugin can: after the cell renders, hide the shell's gear and render
 * `@dsh-cool/icons`' archive glyph in the seat beside the label. dsh-cool-theme
 * patches its palette into the same seat for the same reason.
 *
 * Matching is by the rendered label rather than by class hash, because the
 * shell's CSS module hashes rotate between releases. The observer only watches
 * child-list changes: opening and closing Settings replaces the cell's children,
 * while typing elsewhere in the page usually edits text nodes and must not
 * trigger a scan.
 */
import { type Translate } from './locales.js';
/**
 * Keep the Sessions entry's glyph patched for the plugin's lifetime.
 *
 * Runs once for a panel that is already open and again whenever the shell mounts
 * or re-renders the navigation. The disposer removes the inserted spans and
 * restores the gears, so an HMR update does not leave two glyphs in the seat.
 *
 * @param t - the plugin's translate seat, for the current locale's label.
 * @returns the disposer that stops observation and restores the shell's DOM.
 */
export declare function installSessionNavIcon(t: Translate): () => void;
//# sourceMappingURL=nav-icon.d.ts.map