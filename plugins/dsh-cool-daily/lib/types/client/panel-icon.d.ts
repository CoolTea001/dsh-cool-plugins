/**
 * The sidebar row's glyph, plus the unread mark that rides with it.
 *
 * The shell owns the row — the button, the label, the tooltip, and the hover and
 * selected fills — and hands this slot a `size` and the active flag inside a
 * fixed 16px glyph box. It renders the label itself and offers no seat beside it,
 * so the mark is measured into place: it stays a child of this slot (absolutely
 * positioned against the glyph's own box) and is laid out against the row's own
 * box — pinned to the row's right edge, centred on its height, clear of the text
 * with room to spare. When the row is too narrow for both, the mark steps aside
 * rather than covering the name.
 *
 * Collapsed to the icon rail there is no label and no width to spend on a word,
 * so the mark falls back to a dot on the glyph's top-right corner: with the text
 * gone, the icon is the only place left to say "there is something new here".
 *
 * The mark is decorative: the row's label is the accessible name (the shell wraps
 * this slot in `aria-hidden`), and the article list, not this mark, is where
 * unread state is actually acted on.
 */
import * as React from 'react';
import type { Translate } from './locales.js';
/** Props the sidebar hands a `sidebar.panellist` occupant. */
export interface DailyPanelIconProps {
    /** Glyph edge in px: 16 in the expanded column, 18 in the collapsed rail. */
    size?: number;
    /** Whether this panel is the selected one; the shell also paints the row. */
    active?: boolean;
    /** The locale seat the shell synthesizes for this registration. */
    t: Translate;
}
/**
 * Render the entry's document glyph, marked while anything is unread.
 *
 * @param props - the glyph size the shell asks for and the locale seat.
 * @returns the glyph, plus the "New" mark (or the rail's dot) while unread.
 */
export declare function DailyPanelIcon({ size, t }: DailyPanelIconProps): React.ReactElement;
//# sourceMappingURL=panel-icon.d.ts.map