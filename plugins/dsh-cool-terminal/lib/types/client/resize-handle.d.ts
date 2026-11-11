/**
 * Pointer gesture for the terminal sidebar's right edge.
 *
 * A drag does not render React: the owner writes each width to the page root,
 * and only a completed gesture records it. Pointer capture keeps events coming
 * after the pointer leaves the 1px boundary. One queued animation frame holds
 * only the latest coordinate; a release uses that coordinate directly instead
 * of waiting for a frame that would draw an obsolete width.
 */
import { type ReactElement } from 'react';
export interface ResizeHandleProps {
    /** The width the page is drawing as the gesture starts, in CSS pixels. */
    readonly onStart: () => number;
    /** Draw the width the pointer now implies. Called at most once a frame. */
    readonly onDrag: (width: number) => void;
    /** Record and draw the width the gesture settled on. */
    readonly onCommit: (width: number) => void;
    /** The gesture ended without a width: draw the recorded layout again. */
    readonly onEnd: () => void;
}
/** The draggable boundary; its stylesheet supplies the wider hit target. */
export declare function ResizeHandle(props: ResizeHandleProps): ReactElement;
//# sourceMappingURL=resize-handle.d.ts.map