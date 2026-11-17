/**
 * What a Markdown owner says when it does not own file drag.
 *
 * The shell's renderer draws a local image through `DraggableImage`, which takes
 * explicit `FileDragActions` and calls `actions.prepare(...)` as soon as a
 * pointer aims at the picture. The actions are supplied by whoever owns the
 * transfer — in a stock profile that is the `ui-file-drag` plugin, which keeps
 * the browser's `DownloadURL` payload and the desktop bridge in one place, and
 * publishes them as the `fileDrag` service.
 *
 * A plugin that renders Markdown but does not own transfers still has to answer
 * with *something*: the delegate's `fileImages.fileDrag` is not optional in the
 * renderer's contract, and an absent one is a `TypeError` on the first hover
 * rather than a picture that simply cannot be dragged out of the page.
 *
 * So this is the honest no: the picture renders, the lightbox opens, and a drag
 * does nothing. A page that *does* have the service should pass its actions
 * through instead — see {@link inheritFileDrag}.
 */

import type { FileDragActions } from '@deepseek-ai/dsh-client-ui-primitives'

/**
 * Actions that accept every drag and start none.
 *
 * `prepare` resolves to a prepared operation whose `start` reports that the
 * browser payload was not claimed, which is exactly how the renderer is told to
 * let the gesture go: it prevents the default and releases the preparation,
 * leaving the image where it was. `reportFailure` stays silent because nothing
 * failed — this page does not offer the gesture at all.
 */
export const refuseFileDrag: FileDragActions = {
  prepare: async () => ({
    start: () => false,
    release: () => {},
  }),
  reportFailure: () => {},
}

/**
 * Pick the file-drag actions a Markdown pane should forward.
 *
 * The rule is "inherit before refusing": an enclosing scope that already owns
 * transfers hands down its actions, and only when none exists does the pane fall
 * back to {@link refuseFileDrag}. Threading the service down as a prop would
 * work too, but every Markdown surface would have to remember to do it; reading
 * the nearest delegate is the same answer the renderer itself is asking for.
 *
 * @param enclosing - the delegate from {@link useMarkdownDelegate}, if the pane
 *   is rendered under one.
 * @returns the actions to publish on `fileImages.fileDrag`.
 */
export function inheritFileDrag(
  enclosing: { readonly fileImages?: { readonly fileDrag: FileDragActions } | undefined } | undefined,
): FileDragActions {
  return enclosing?.fileImages?.fileDrag ?? refuseFileDrag
}
