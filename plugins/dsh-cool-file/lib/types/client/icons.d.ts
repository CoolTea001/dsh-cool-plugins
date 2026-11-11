/**
 * The page's glyphs — the header's refresh and eye, and the arrow each tree
 * branch turns when it opens — are the SVGs under `src/client/assets/`: the
 * client bundle is one JS file the platform's module loader evaluates, so a
 * sibling asset would never be fetched. `tsdown.config.ts` reads the artwork at
 * build time and exposes it as the `__DSH_CF_ICONS__` string map consumed here.
 *
 * Each asset is 24-unit stroke markup riding `currentColor`, so the glyph tints
 * with the surrounding CSS, and it carries no size of its own: the seat that
 * wraps it decides that (`.dsh-cf-icon-btn svg` in `styles.ts`).
 *
 * The folder and file glyphs are drawn inline instead — they are small enough
 * that a separate asset would only add a file — and also ride `currentColor`.
 */
import { type ReactElement } from 'react';
/** A closed folder. */
export declare function IconFolder({ size }: {
    size?: number;
}): ReactElement;
/** A text file with a folded corner. */
export declare function IconFile({ size }: {
    size?: number;
}): ReactElement;
/** The circular arrow that re-reads the tree (assets/refresh.svg). */
export declare function IconRefresh(): ReactElement;
/** An open eye: the tree is showing entries the system hides (assets/show.svg). */
export declare function IconShow(): ReactElement;
/** A struck-through eye: the tree is hiding those entries (assets/hide.svg). */
export declare function IconHide(): ReactElement;
/** The arrow a branch turns from closed to open (assets/arrow.svg). */
export declare function IconArrow(): ReactElement;
/** The chevron on the header's mode button: a menu opens below it. */
export declare function IconChevronDown({ size }: {
    size?: number;
}): ReactElement;
//# sourceMappingURL=icons.d.ts.map