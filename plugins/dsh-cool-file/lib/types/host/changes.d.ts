/**
 * The tree's four commands — rename, create, delete, reveal — as the Host
 * performs them.
 *
 * The Files tab reads; these are the four ways it writes. Everything they share
 * is one fence: the path must name a workspace entry inside the session's own
 * workspace, and the write must be one the session's sandbox policy allows, so
 * a read-only session cannot use the tree to do what its own agent tools
 * refuse. Which effect performs the change depends on what is being changed:
 *
 * - **Files are created and removed** through the composed `fs` service, which
 *   is where the workspace fence already lives: `writeText` with `createIfAbsent`
 *   creates an empty file, and `deleteFile` removes one. Both are atomic there,
 *   so a failure leaves the file as it was.
 * - **Renames, directory creations and directory removals** have no counterpart
 *   in that service: its `moveFile` publishes the source's *text* at the
 *   destination, which refuses a binary file and refuses a directory outright,
 *   and it never creates or removes a directory at all. Those four go through
 *   `node:fs/promises`, and only once the entry has been proven to be a path on
 *   *this* machine and inside the session's workspace. A workspace living in a
 *   sandbox or over SSH answers `unsupported` rather than having a host
 *   operation applied to a path that merely looks local, and an entry whose
 *   identity lies outside the workspace — a symlink out of the tree — answers
 *   `invalid` rather than being followed.
 *
 * The policy check runs for every mutation, including the directory ones, so
 * the tree cannot be a way around the session's own mode.
 */
import type { DesktopFacts, MutationPayload, RevealPayload } from '../shared/contract.js';
/**
 * What the serving desktop can do with a workspace path.
 *
 * The page draws Reveal from this answer, so the question is asked of the same
 * service that would perform it — a Host with no native opener answers that
 * reveals are unavailable instead of offering a command that must fail after
 * the click.
 *
 * @param ctx - the Host plugin context.
 * @returns the desktop facts; every field is false when nothing can answer.
 */
export declare function desktopFacts(ctx: any): DesktopFacts;
/**
 * Whether the session's policy lets the page mutate its workspace.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns true when a write would not be refused by the policy alone.
 */
export declare function writableWorkspace(ctx: any, sessionId: unknown): boolean;
/**
 * Rename one file or directory in place.
 *
 * A file is renamed by the filesystem service's own move, which keeps the
 * content, the line endings and the mode. A directory is renamed on the Host
 * filesystem once the target has been proven local, because the service has no
 * directory move and inventing one across a sandbox boundary would be worse
 * than refusing.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the entry to rename, as a workspace path.
 * @param rawName - the new name, as one path segment.
 * @returns the new workspace path, or an `ok: false` answer.
 */
export declare function renameEntry(ctx: any, sessionId: unknown, rawPath: unknown, rawName: unknown): Promise<MutationPayload>;
/**
 * Create one new file or directory under an existing directory.
 *
 * A file is created empty — the reader's next click opens it, and the editor is
 * what puts text in it. A directory is made on the Host filesystem once the
 * parent has been proven local, for the same reason a directory rename is.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawParent - the directory to create in, as a workspace path (empty for the root).
 * @param rawName - the new entry's name, as one path segment.
 * @param kind - which kind of entry to create.
 * @returns the new workspace path, or an `ok: false` answer.
 */
export declare function createEntry(ctx: any, sessionId: unknown, rawParent: unknown, rawName: unknown, kind: 'file' | 'directory'): Promise<MutationPayload>;
/**
 * Delete one file or directory.
 *
 * A regular file goes through the filesystem service, which is bounded and
 * version-aware. A directory is removed recursively on the Host filesystem: the
 * page has already asked the reader to confirm, and "delete this folder" in a
 * tree means the folder and what it holds — leaving the children behind would
 * leave a workspace the reader cannot see half of.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the entry to delete, as a workspace path.
 * @returns the removed path, or an `ok: false` answer.
 */
export declare function deleteEntry(ctx: any, sessionId: unknown, rawPath: unknown): Promise<MutationPayload>;
/**
 * Show one workspace path in the Host desktop's file manager.
 *
 * The path is verified before it is handed over: it must resolve inside the
 * session's workspace, and it must also be a path this Host can reach — the
 * same canonical round trip the session controller makes before it opens
 * anything. The reveal then belongs to that service rather than to this plugin,
 * so the Finder/Explorer command itself stays one implementation in the product.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @param rawPath - the entry to reveal, as a workspace path.
 * @returns the reveal outcome, or an `ok: false` answer.
 */
export declare function revealEntry(ctx: any, sessionId: unknown, rawPath: unknown): Promise<RevealPayload>;
//# sourceMappingURL=changes.d.ts.map