/**
 * Workspace reads for the Files tab.
 *
 * Two questions the page asks, and nothing else: what a directory holds, and
 * what a text file says. Both are answered through the composed
 * `workspaceFiles` service, so the session's own workspace root is the only
 * directory a page can reach and every listing stays inside it. A session that
 * is not live yet still owns a durable header, and that header's `cwd` is what
 * lets a reopened page answer for its workspace on the first request.
 *
 * A session the Host cannot name at all falls back to the executor's default
 * directory, which is at least a directory that exists; the page then shows
 * whatever that directory holds rather than an empty tab.
 */
import type { ListPayload, ReadPayload } from '../shared/contract.js';
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
//# sourceMappingURL=files.d.ts.map