/**
 * The plugin's own icon set.
 *
 * Every glyph lives in `assets/` as an SVG, and that file is the source of
 * truth for its artwork: `tsdown` inlines it as text (the `loader` map in
 * tsdown.config.ts, described by assets.d.ts), and the wrapper below narrows the
 * markup to the same `{ size, className }` surface the shell's icons expose, so
 * a call site swaps one for the other without touching its layout.
 *
 * Two properties of the artwork the wrapper keeps: the strokes draw in
 * `currentColor`, so whichever control owns an icon goes on painting it — the
 * sidebar row's hover and selected states included — with no CSS here; and
 * React owns the `<svg>` root, so `size` stays a real prop instead of riding on
 * the asset's own `1em` box.
 */
import * as React from 'react';
/** What a caller may set on one of these icons. */
export interface IconProps {
    /** Square edge length in px. Defaults to 16, the box the artwork is drawn for. */
    size?: number;
    className?: string;
}
/** The sheet-of-paper glyph: the sidebar entry's icon, and the empty page's mark. */
export declare const DocIcon: React.FC<IconProps>;
/** The sliders glyph: the page's settings entry. */
export declare const SettingsIcon: React.FC<IconProps>;
/** The sparkle glyph: the manual generation action while it is idle. */
export declare const SparkleIcon: React.FC<IconProps>;
/**
 * The open ring: the manual generation action while a batch is running. It is
 * drawn as a three-quarter circle so the stylesheet's spin reads as motion
 * rather than as a shape turning on itself.
 */
export declare const LoaderIcon: React.FC<IconProps>;
/** The up arrow: the reading view's back-to-top control. */
export declare const ArrowUpIcon: React.FC<IconProps>;
/** The magnifier glyph: the article search field. */
export declare const SearchIcon: React.FC<IconProps>;
/** The left arrow: the article reader's way back to the list. */
export declare const BackIcon: React.FC<IconProps>;
/**
 * The disclosure mark, drawn pointing right and turned by the stylesheet: the
 * model picker's trigger turns it down while closed and up while open, and a
 * provider row turns it down while its models are showing.
 */
export declare const ArrowRightIcon: React.FC<IconProps>;
/** The check a chosen row carries. */
export declare const CheckIcon: React.FC<IconProps>;
//# sourceMappingURL=icons.d.ts.map