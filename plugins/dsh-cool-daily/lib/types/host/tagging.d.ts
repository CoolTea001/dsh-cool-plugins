/**
 * One-time tag backfill for articles written before tags existed.
 *
 * New generations ask the model for tags in the same JSON answer that carries
 * the article, so they need nothing here. Files that predate that field still
 * deserve tags drawn from their content rather than from their section
 * headings, so the plugin asks the model once per file at startup and writes the
 * answer into the front matter — the file stays the single source of truth, and
 * a later start finds the tags already there and does nothing.
 *
 * Tagging is best effort: no session, no retry loop, and a failure simply
 * leaves the file for the next start. Nothing the page shows waits on it.
 */
/**
 * Tag every stored article that has none yet.
 *
 * Files are visited one at a time so a cold start never fires a burst of model
 * calls; each failure is swallowed and simply retried by the next start.
 */
export declare function backfillTags(ctx: any): Promise<void>;
/**
 * Schedule the backfill a few seconds after startup.
 * @returns the disposer that cancels a backfill that has not begun yet.
 */
export declare function startTagBackfill(ctx: any): () => void;
//# sourceMappingURL=tagging.d.ts.map