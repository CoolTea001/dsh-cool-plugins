/**
 * The image pane: one workspace picture drawn as a picture.
 *
 * A file the kind table calls an image is not read for the preview at all. What
 * the page needs is a decoded picture, and the browser already owns a decoder, so
 * the pane hands an `<img>` the raw route's address (`raw.ts`) and lets it fetch,
 * decode and lay the picture out. That is why this module holds almost no state:
 * the interesting work happens in the browser's image pipeline, and what is left
 * for the page is what an `<img>` cannot say — whether it is still loading, and
 * whether it failed.
 *
 * The stage scrolls rather than covering: a tall screenshot or a wide diagram is
 * shown at its own proportions and may be panned, instead of being cropped to
 * fill a frame the picture did not ask for. Clicking the picture opens the
 * shell's own lightbox at the same address, which is what makes a small
 * thumbnail legible without a zoom control of this page's invention.
 *
 * The pane is mounted once per file — the page keys its body by the selected path
 * and the mode — so the load state below belongs to exactly one picture.
 *
 * A failure has two shapes and they are not interchangeable. A picture the pane
 * already knows is over the cap cannot be rescued by asking again, so it is
 * reported as a size problem with no retry; anything else (a file that moved, a
 * decode that failed, a Host that refused) may well be transient, so it offers
 * one. The Host's own error text cannot help here: an `<img>` never exposes the
 * body of a failed response, which is why the size is checked on this side from
 * the listing's own measurement.
 */
import { type ReactElement } from 'react';
import type { Translate } from './locales.js';
/** Props of the image pane. */
interface ImagePreviewProps {
    /** The raw address of the picture, from the Host's raw route. */
    readonly src: string;
    /** The file's basename, used as the picture's accessible description. */
    readonly alt: string;
    /**
     * The Host's refusal, when this pane's owner already knows the picture cannot
     * be shown (it is over the raw route's cap). Undefined means "ask for it".
     */
    readonly refusal?: string | undefined;
    /** The page's translate seat. */
    readonly t: Translate;
}
/**
 * Draw one workspace image, and open it enlarged when clicked.
 *
 * @param props - the picture's address, its name, any known refusal, and the page's copy.
 * @returns the image stage.
 */
export declare function ImageView({ src, alt, refusal, t }: ImagePreviewProps): ReactElement;
export {};
//# sourceMappingURL=image.d.ts.map