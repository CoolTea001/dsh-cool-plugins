/**
 * Read receipts for the article list.
 *
 * The Markdown files stay the source of truth for what an article says; whether
 * the reader has opened one is separate local state, kept in a small JSON map
 * beside the settings so replacing or deleting an article never touches it.
 * Writes are read-modify-write followed by an atomic rename: the file is tiny
 * and this plugin is its only writer.
 */
/** Every article id the reader has already opened. */
export declare function readIds(): Promise<Set<string>>;
/** Whether one article has been opened. */
export declare function isRead(id: string): Promise<boolean>;
/** Drop one article's receipt, so a deleted article leaves no trace behind. */
export declare function forgetRead(id: string): Promise<void>;
/** Record that one article was opened, keeping the first receipt it had. */
export declare function markRead(id: string): Promise<void>;
//# sourceMappingURL=reads.d.ts.map