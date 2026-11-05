/**
 * The Markdown article store.
 *
 * An article is one file under `articles/`, named by its id, with a small
 * front-matter header for the fields the list needs. The files are the source of
 * truth: the list is rebuilt by reading the directory, so a file dropped in by
 * hand appears on the page and a deleted one disappears, without an index that
 * could disagree with the disk.
 *
 * Every write is one `writeFile` with an exclusive flag, so two generations
 * racing on the same second cannot silently overwrite each other.
 */
import type { ArticleDetail, ArticleSummary } from '../shared/contract.js';
/**
 * Validate an article id coming from the browser.
 *
 * The id becomes a path segment, so it is restricted to a conservative set and
 * anything else is refused before a path is built.
 */
export declare function isArticleId(value: unknown): value is string;
/**
 * Normalize a list of candidate tags: strip Markdown punctuation, drop blanks
 * and duplicates, shorten each one, and keep at most {@link TAG_LIMIT}.
 */
export declare function cleanTags(values: readonly unknown[]): string[];
/** Turn one body into the plain opening sentence a card shows. */
export declare function excerptOf(content: string): string;
/** The local calendar day of one instant, as `YYYY-MM-DD`. */
export declare function localDate(now?: Date): string;
/** Read every article, newest first. */
export declare function listArticles(): Promise<ArticleSummary[]>;
/** Read one article, or `undefined` when it does not exist or is unreadable. */
export declare function readArticle(id: string): Promise<ArticleDetail | undefined>;
/**
 * The tags one file stores in its front matter.
 *
 * `undefined` means the file predates tags — the caller may then derive tags
 * from the body or ask the model for some, while an empty array is a real
 * stored answer and is left alone.
 */
export declare function readStoredTags(id: string): Promise<string[] | undefined>;
/**
 * Replace one file's tag list.
 *
 * Only the header line changes: every other front-matter line and the whole
 * body are copied through, so a hand-edited field or a regenerated file keeps
 * everything it had. The write is atomic, so a reader never sees half a header.
 */
export declare function setArticleTags(id: string, tags: readonly string[]): Promise<void>;
/**
 * Delete one article's file.
 *
 * The file is the article, so removing it is the whole operation; a path that
 * does not exist is reported as "nothing to delete" rather than as a failure,
 * which keeps a double click from turning into an error banner.
 *
 * @param id - the article id the page named.
 * @returns true when a file was removed.
 */
export declare function deleteArticle(id: string): Promise<boolean>;
/** One article the model produced, before it becomes a file. */
export interface GeneratedArticle {
    title: string;
    category: string;
    content: string;
    /** Content tags the model proposed; empty when it offered none. */
    tags: string[];
}
/**
 * Write one generated article as its own Markdown file.
 *
 * @param article - title, category, and Markdown body.
 * @param date - the local day it belongs to.
 * @param index - its position in the batch, which only distinguishes ids.
 * @returns the stored summary.
 */
export declare function saveArticle(article: GeneratedArticle, date: string, index: number): Promise<ArticleSummary>;
//# sourceMappingURL=articles.d.ts.map