/**
 * Where the page finds a workspace file's raw bytes, and how a Markdown
 * destination becomes one.
 *
 * An image is not something script reads and draws: the browser decodes it, so
 * the pane needs an address an `<img>` can fetch rather than a JSON answer it
 * would have to turn into a blob. That address is the Host's raw route (see
 * `RAW_ROUTE` in `shared/kinds.ts`), which answers the bytes behind the same
 * workspace fence as every other read.
 *
 * The same address is what a Markdown image destination resolves to, so this
 * module also owns turning a destination — relative to the document that carried
 * it — into a workspace path. Two spellings of "destination" arrive here, and
 * they must not be confused:
 *
 * - the **authored** one, exactly as the Markdown source wrote it, which is
 *   percent-encoded (`my%20shot.png`) and is what `pathImages` receives;
 * - the **decoded** one, which the shell's renderer has already unescaped before
 *   handing it to the delegate callbacks (`openFile`, `fileImages.resolve`).
 *
 * Decoding twice is the bug that hides in that difference: a file genuinely named
 * `100%.md` arrives decoded as `100%.md`, and `decodeURIComponent` on that throws.
 */
/**
 * The workspace path a Markdown destination names, relative to its document.
 *
 * Percent-encoding is undone first, because that is how the author spelled it:
 * `my file.png` is written `my%20file.png`. A trailing fragment or query
 * (`?raw=true`) names no part of the path, so it is cut before decoding.
 *
 * @param fromFile - the workspace path of the document holding the destination.
 * @param destination - the destination exactly as the Markdown source wrote it.
 * @returns the target as a workspace path, or undefined when it names none.
 */
export declare function resolveAuthoredPath(fromFile: string, destination: string): string | undefined;
/**
 * The workspace path one already-decoded local destination names.
 *
 * This is what the shell's delegate callbacks hand over (a link's target and a
 * rendered image's path), so nothing is decoded here a second time.
 *
 * @param fromFile - the workspace path of the document that named the target.
 * @param target - the target with percent-escapes already resolved.
 * @returns the target as a workspace path, or undefined when it names none.
 */
export declare function resolveDecodedPath(fromFile: string, target: string): string | undefined;
/**
 * The address of one workspace file's raw bytes.
 *
 * Absolute on purpose: the Markdown renderer only accepts a rewritten image
 * destination whose protocol is http(s), blob or data, so a root-relative path
 * would be discarded and the picture replaced by its alt text.
 *
 * @param path - the file as a workspace path.
 * @param sessionId - the session whose workspace holds it, when known.
 * @returns a same-origin URL an `<img>` can fetch.
 */
export declare function rawImageUrl(path: string, sessionId: string | undefined): string;
/**
 * The address of one workspace image, when the path names an image at all.
 *
 * @param path - the file as a workspace path.
 * @param sessionId - the session whose workspace holds it, when known.
 * @returns the URL, or undefined when the path is not an image.
 */
export declare function imageUrlOf(path: string, sessionId: string | undefined): string | undefined;
/**
 * The image address a Markdown destination resolves to.
 *
 * A destination that names a text file is left alone: rewriting it to the raw
 * route would only draw a broken image, while the renderer's own fallback (the
 * alt text) is the honest answer.
 *
 * @param fromFile - the workspace path of the Markdown document.
 * @param destination - the destination exactly as the source wrote it.
 * @param sessionId - the session whose workspace holds both files, when known.
 * @returns the URL, or undefined when the destination is not a workspace image.
 */
export declare function markdownImageUrl(fromFile: string, destination: string, sessionId: string | undefined): string | undefined;
//# sourceMappingURL=raw.d.ts.map