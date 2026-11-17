/**
 * The Markdown pane: a workspace document drawn as a document.
 *
 * A `.md` file opened in preview mode is not source any more — it is a page. The
 * renderer that draws it is the shell's own `MarkdownText`, the same one the
 * transcript uses for an assistant's answer, so a document in this tab looks
 * exactly like the same document quoted in a conversation: the same headings,
 * the same tables, the same fenced code with its copy button, the same KaTeX.
 * Building a second Markdown renderer here would mean two answers to "what does
 * this document look like".
 *
 * Three pieces of the shell's renderer vocabulary need an owner, and this module
 * is it:
 *
 * 1. **Local images.** The renderer refuses a destination that is not absolute
 *    http(s) unless its owner vouches for one, because a rendered message must
 *    not be able to name a file on the reader's disk. Here the owner is the page
 *    already browsing that workspace, so `pathImages` turns a relative
 *    destination into the raw route's address (`raw.ts`) — which is how a
 *    document's own screenshots appear inside it.
 * 2. **Local links.** `openFile` makes a link to a sibling file a button that
 *    opens it in this tab, and `fileImages` gives a rendered image the address
 *    its lightbox needs. Both callbacks receive an already-decoded path, which
 *    is why they resolve through `resolveDecodedPath` and not the authored
 *    resolver. A link whose target this page cannot open (one that climbs out of
 *    the workspace, or names a directory) is left as plain text: a button that
 *    answers with an English Host error is worse than a word that does nothing.
 * 3. **Front matter.** A workspace Markdown file very often starts with a YAML
 *    block, and the renderer has no grammar for one: those three or four lines
 *    would become a horizontal rule followed by an accidental heading. The block
 *    is cut before rendering and shown as source above the document, so the
 *    metadata a reader may want is not silently dropped.
 *
 * The text arrives from a whole-file read (see `openFile` in `files.tsx`), so a
 * document renders in full. Two fallbacks hand it back to the source view instead
 * of rendering it: a document past the render budget, and one the Host could only
 * read part of (a renderer fed half a file can swallow the rest of a page inside
 * an unbalanced code fence). Both say why above the source.
 */

import { useCallback, useMemo, type ReactElement } from 'react'
import {
  MarkdownDelegateProvider,
  MarkdownText,
  inheritFileDrag,
  useMarkdownDelegate,
} from '@dsh-cool/ui'
import { CodePreview } from './code.js'
import type { Translate } from './locales.js'
import { splitFrontMatter } from './frontmatter.js'
import { imageUrlOf, markdownImageUrl, resolveDecodedPath } from './raw.js'

/**
 * Largest document that is worth rendering as a document.
 *
 * The Host will hand over up to two megabytes of text, and the renderer builds a
 * React element tree for every block, row and token in it — a generated API dump
 * or a vendored changelog at that size would freeze the tab on the click. Past
 * this size the pane shows the source instead, which is what a reader scrolling a
 * document that large was going to do anyway, and says why.
 */
const MAX_MARKDOWN_CHARS = 400_000

/** Props of the Markdown pane. */
interface MarkdownPreviewProps {
  /** The document's text, as the Host read returned it. */
  readonly text: string
  /** The document's workspace path, which relative destinations resolve against. */
  readonly path: string
  /** The session whose workspace holds the document, when known. */
  readonly sessionId: string | undefined
  /**
   * Whether `text` is only the beginning of the file.
   *
   * A partial document is rendered as source rather than as a page: a truncated
   * fence or table renders as something the document never said.
   */
  readonly partial: boolean
  /**
   * Open one workspace file in this tab, for a link the document carries.
   *
   * A destination the page cannot open is never passed here, so the callback can
   * assume the path is inside the workspace.
   */
  readonly onOpenFile: (path: string, line?: number) => void
  /** The page's translate seat. */
  readonly t: Translate
}

/** Whether a document is too large to render, and must be shown as source. */
export function isMarkdownTooLarge(text: string): boolean {
  return text.length > MAX_MARKDOWN_CHARS
}

/**
 * Draw one workspace Markdown document.
 *
 * @param props - the text, its path, the workspace, and the page's copy.
 * @returns the rendered document.
 */
export function MarkdownPreview({
  text,
  path,
  sessionId,
  partial,
  onOpenFile,
  t,
}: MarkdownPreviewProps): ReactElement {
  // One stable object per language: the renderer discards its parse cache when
  // the labels identity changes, so a fresh literal per render would re-parse the
  // document on every keystroke elsewhere on the page.
  const labels = useMemo(
    () => ({
      code: { copyLabel: t('markdown.copy'), copiedLabel: t('markdown.copied') },
      footnotes: t('markdown.footnotes'),
    }),
    [t],
  )

  // Authored destinations: still percent-encoded, hence the authored resolver.
  const pathImages = useMemo(
    () => ({ resolve: (destination: string) => markdownImageUrl(path, destination, sessionId) }),
    [path, sessionId],
  )

  /**
   * Open one destination the renderer decoded, when this page can open it.
   *
   * The renderer calls with a line when the destination carried `#L24`, which is
   * passed on so the file opens at the line the link meant. A destination the
   * page cannot reach is refused here, before the Host would have to answer with
   * an English error.
   */
  const openFile = useCallback(
    (target: string, options?: { line?: number }) => {
      const decoded = resolveDecodedPath(path, target)
      if (decoded === undefined) return
      onOpenFile(decoded, options?.line)
    },
    [onOpenFile, path],
  )

  // The delegate's image vocabulary: this is what puts a rendered picture behind
  // a lightbox and gives its status line words. Its `resolve` receives a decoded
  // path, not an authored destination.
  //
  // `fileDrag` is part of the same object and cannot be left out: the renderer
  // draws a local picture through `DraggableImage`, which calls the actions on
  // the first hover. A pane that does not own transfers inherits them from
  // whoever does (the shell's `ui-file-drag` plugin, when the profile has it),
  // and otherwise answers with a no-op that leaves the picture in place —
  // which is `@dsh-cool/ui`'s `inheritFileDrag`.
  const enclosing = useMarkdownDelegate()
  const fileDrag = useMemo(() => inheritFileDrag(enclosing), [enclosing])
  const fileImages = useMemo(
    () => ({
      fileDrag,
      resolve: (target: string) => {
        const decoded = resolveDecodedPath(path, target)
        return decoded === undefined ? undefined : imageUrlOf(decoded, sessionId)
      },
      labels: {
        dialog: t('preview.imageDialog'),
        close: t('preview.imageClose'),
        open: t('preview.imageOpen'),
        loading: t('preview.imageLoading'),
        failed: t('preview.imageFailed'),
      },
    }),
    [fileDrag, path, sessionId, t],
  )

  const { frontMatter, body } = useMemo(() => splitFrontMatter(text), [text])

  // A document the renderer cannot be trusted with is shown as source, with the
  // reason above it: half a page rendered is a page that lies.
  if (partial || isMarkdownTooLarge(body)) {
    return (
      <>
        <div className="dsh-cf-truncated">
          {partial ? t('preview.markdownPartial') : t('preview.markdownLarge')}
        </div>
        <CodePreview text={text} path={path} />
      </>
    )
  }

  return (
    <div className="dsh-cf-markdown">
      {frontMatter === '' ? null : (
        // The metadata the renderer has no grammar for: shown as the block it is,
        // rather than as the divider and stray heading it would otherwise become.
        <pre className="dsh-cf-front-matter">{frontMatter.trimEnd()}</pre>
      )}
      <MarkdownDelegateProvider openFile={openFile} fileImages={fileImages}>
        <MarkdownText text={body} labels={labels} pathImages={pathImages} />
      </MarkdownDelegateProvider>
    </div>
  )
}
