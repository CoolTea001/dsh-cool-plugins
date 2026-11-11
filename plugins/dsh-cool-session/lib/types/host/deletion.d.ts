/**
 * On-disk Session deletion, including the subagent Sessions beneath one root.
 *
 * DSH exposes no deletion command of its own, so this Host module treats the
 * Session artifact as the unit of removal. It first stops whatever the Session
 * still runs, retires the live Session entry, and only then removes the
 * header-verified directory. Paths never come from the request: every directory
 * is derived from the persistence backend's own `locate()` answer and checked
 * to be exactly one Session directory below the configured root.
 *
 * The operation is intentionally fail-closed. A descendant scan that cannot be
 * completed, a directory that leaves the root, a symlink, an artifact whose
 * header names another Session, or a Session that cannot be retired all abort
 * the delete before the first `rm`. A failure after some descendants were
 * already removed is reported as `delete-partial`, with the remaining ids.
 */
import type { DeletePayload } from '../shared/contract.js';
/**
 * Delete one Session and every subagent Session beneath it.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the root Session to delete.
 * @returns the deletion summary, or one coded refusal.
 */
export declare function deleteSession(ctx: any, sessionId: string): Promise<DeletePayload>;
//# sourceMappingURL=deletion.d.ts.map