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
export const RAW_ROUTE = '/dsh-cool-file/api/raw'

/**
 * Largest image the preview will serve, in bytes.
 *
 * Both halves need it: the Host refuses to send more, and the page can tell a
 * reader that a picture is over the cap before it asks for one. It is generous
 * because a photograph or a screenshot routinely passes the editor's 2 MiB limit.
 */
export const IMAGE_MAX_BYTES = 24 * 1024 * 1024

/**
 * Media type per image extension, the only extensions the raw route answers.
 *
 * Every entry is a format this page's browsers decode. TIFF is deliberately
 * absent even though it is an image: no browser renders one, so listing it would
 * only offer a reader a pane that can never fill — and, worse, would deny them the
 * source view that is the only thing they could actually read. ICO stays because
 * Chromium and WebKit both decode it.
 */
const IMAGE_MEDIA_TYPES: Readonly<Record<string, string>> = {
  apng: 'image/apng',
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  ico: 'image/x-icon',
  jpe: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

/**
 * Extensions the page renders as a document instead of as its source.
 *
 * MDX is deliberately absent: its body is JSX, and a renderer that treats it as
 * Markdown shows the tags as literal text — the source view is the honest one.
 */
const MARKDOWN_EXTENSIONS: ReadonlySet<string> = new Set(['markdown', 'md'])

/**
 * Extensions the page both previews as a picture and edits as text.
 *
 * SVG is the one format browsers render that is also plain source, so it earns a
 * kind of its own rather than being filed under `image`: a reader who wants to
 * look at the artwork and a reader who wants to change one path's colour are
 * asking the same file two questions. Only `.svg` is listed — `.svgz` is gzip,
 * not text, so it stays an image that can only be looked at.
 */
const SVG_EXTENSIONS: ReadonlySet<string> = new Set(['svg'])

/**
 * What the preview pane draws for one path.
 *
 * `image` is shown as the picture itself and nothing else, `markdown` as the
 * rendered document, `svg` as the picture while previewing and as its source
 * while editing, and `text` as numbered, syntax-coloured source.
 */
export type FileKind = 'image' | 'markdown' | 'text' | 'svg'

/**
 * The extension of a workspace path, lower-cased and without its dot.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the final segment's extension, or '' when it has none.
 */
function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1).toLowerCase()
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? '' : name.slice(dot + 1)
}

/**
 * The media type the raw route should answer for one path.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the image media type, or undefined when the path is not an image.
 */
export function imageMediaTypeOf(path: string): string | undefined {
  return IMAGE_MEDIA_TYPES[extensionOf(path)]
}

/**
 * Whether a kind is drawn by an `<img>` rather than by its source.
 *
 * SVG answers yes while previewing and no while editing, so callers that draw
 * the pane pair this with the current mode; callers that only care whether the
 * name is a picture at all can ask it alone.
 *
 * @param kind - one path's kind.
 * @returns whether the preview shows the file as a picture.
 */
export function isPictureKind(kind: FileKind): boolean {
  return kind === 'image' || kind === 'svg'
}

/**
 * Which preview one workspace path earns.
 *
 * SVG is answered before the image table, which also names it: the raw route
 * still serves it as a picture, but the page needs the narrower fact that this
 * file's source is readable and writable.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the kind of pane that draws it.
 */
export function fileKindOf(path: string): FileKind {
  const extension = extensionOf(path)
  if (SVG_EXTENSIONS.has(extension)) return 'svg'
  if (IMAGE_MEDIA_TYPES[extension] !== undefined) return 'image'
  return MARKDOWN_EXTENSIONS.has(extension) ? 'markdown' : 'text'
}
