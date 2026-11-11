/**
 * Workspace reads — and the editor's one guarded write — for the Files tab.
 *
 * Two questions the page asks, and one answer it gives: what a directory holds,
 * what a text file says (paged for the preview, whole for the editor), and the
 * text the editor wants written back. Reads are answered through the composed
 * `workspaceFiles` service, so the session's own workspace root is the only
 * directory a page can reach and every listing stays inside it. The write is the
 * exception: that service is read-only, so saving goes through `ctx.fs`, fenced
 * by the session's own sandbox policy and guarded by the freshness token the
 * editor was handed. A session that is not live yet still owns a durable header,
 * and that header's `cwd` is what lets a reopened page answer for its workspace
 * on the first request.
 *
 * A session the Host cannot name at all falls back to the executor's default
 * directory, which is at least a directory that exists; the page then shows
 * whatever that directory holds rather than an empty tab.
 */
import type { ListPayload, ReadPayload, SavePayload, TextPayload } from '../shared/contract.js';
/**
 * The direct children of one workspace directory.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the directory as a workspace path; empty or absent for the root.
 * @returns the listing, or an `ok: false` answer.
 */
export declare function listDirectory(ctx: any, sessionId: unknown, rawPath: unknown): Promise<ListPayload>;
/**
 * One page of one workspace text file.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the file as a workspace path.
 * @returns the page, or an `ok: false` answer.
 */
export declare function readFile(ctx: any, sessionId: unknown, rawPath: unknown): Promise<ReadPayload>;
/**
 * The complete raw text of one workspace file, for the editor.
 *
 * The preview's paged read is the wrong input for an editor — it is a window,
 * and it drops the terminator after the last line — so this is a second read of
 * the file as it is stored. The freshness token travels with it: a save quotes
 * that token, and the backend refuses the write if the file moved on in between.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the file as a workspace path.
 * @returns the text, or an `ok: false` answer.
 */
export declare function readWholeFile(ctx: any, sessionId: unknown, rawPath: unknown): Promise<TextPayload>;
/**
 * Replace one workspace text file with what the editor holds.
 *
 * Three fences stand between the page and the disk. The path must stay inside
 * the workspace (the same grammar the reads use); the content must be UTF-8 text
 * within the edit cap; and the write is version-guarded by the token the editor
 * read, so a file the agent — or another editor — changed since it was opened is
 * refused with `reason: 'stale'` instead of silently losing that change.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the file as a workspace path.
 * @param rawText - the complete new content.
 * @param rawVersion - the freshness token the editor's read returned.
 * @returns the save outcome, or an `ok: false` answer.
 */
export declare function saveFile(ctx: any, sessionId: unknown, rawPath: unknown, rawText: unknown, rawVersion: unknown): Promise<SavePayload>;
//# sourceMappingURL=files.d.ts.map