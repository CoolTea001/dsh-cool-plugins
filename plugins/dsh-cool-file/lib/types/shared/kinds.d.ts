/**
 * What kind of preview one workspace path earns.
 *
 * Both halves read this table. The browser half asks it which pane to draw, and
 * the Host half asks it which paths its raw-bytes route may answer — so the set
 * of files the page can display as an image and the set the server will send as
 * an image are one list, not two tables that can drift.
 *
 * A path not in either table is text: the preview reads its lines and colours
 * them, and the editor may write it back. Nothing here reads the file itself —
 * a kind is decided by the name the workspace already gave it, which is what
 * keeps the decision available before a byte is requested.
 */
/** Where the Host serves a workspace file's raw bytes. */
export declare const RAW_ROUTE = "/dsh-cool-file/api/raw";
/**
 * Largest image the preview will serve, in bytes.
 *
 * Both halves need it: the Host refuses to send more, and the page can tell a
 * reader that a picture is over the cap before it asks for one. It is generous
 * because a photograph or a screenshot routinely passes the editor's 2 MiB limit.
 */
export declare const IMAGE_MAX_BYTES: number;
/**
 * What the preview pane draws for one path.
 *
 * `image` is shown as the picture itself, `markdown` as the rendered document,
 * and `text` as numbered, syntax-coloured source.
 */
export type FileKind = 'image' | 'markdown' | 'text';
/**
 * The media type the raw route should answer for one path.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the image media type, or undefined when the path is not an image.
 */
export declare function imageMediaTypeOf(path: string): string | undefined;
/**
 * Which preview one workspace path earns.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the kind of pane that draws it.
 */
export declare function fileKindOf(path: string): FileKind;
//# sourceMappingURL=kinds.d.ts.map