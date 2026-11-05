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
/** Turn one body into the plain opening sentence a card shows. */
export declare function excerptOf(content: string): string;
/** The local calendar day of one instant, as `YYYY-MM-DD`. */
export declare function localDate(now?: Date): string;
/** Read every article, newest first. */
export declare function listArticles(): Promise<ArticleSummary[]>;
/** Read one article, or `undefined` when it does not exist or is unreadable. */
export declare function readArticle(id: string): Promise<ArticleDetail | undefined>;
/** One article the model produced, before it becomes a file. */
export interface GeneratedArticle {
    title: string;
    category: string;
    content: string;
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