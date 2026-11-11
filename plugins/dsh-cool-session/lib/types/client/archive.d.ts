/**
 * Archive and unarchive through DSH's own Workspace controller.
 *
 * The browser already holds a live Workspace snapshot and a generated remote
 * namespace for it, so archival does not need a route of this plugin's own: the
 * controller's call keeps the archive set authoritative on the Host and pushes
 * the new set to every connected surface. The single failure worth wording
 * separately is the Host's refusal of a Session with running work: the panel
 * offers to stop that work and retry, exactly as the native sidebar does.
 */
import type { Failure } from '../shared/contract.js';
/** One family of work that keeps a Session from being archived. */
export interface ArchiveActivity {
    /** Provider family: `turn`, `subagent`, `job`, `schedule`, or one this build does not know. */
    readonly kind: string;
    /** Number of active items the family reported. */
    readonly count: number;
}
/**
 * One archive attempt's outcome.
 *
 * `active` is the Host's "stop this first" answer; every other refusal is
 * either a code the page words from its dictionary (`failure`), a missing
 * service (`unavailable`), or raw diagnostic text (`message`).
 */
export interface ArchiveResult {
    readonly ok: boolean;
    readonly active?: readonly ArchiveActivity[];
    readonly failure?: Failure;
    readonly unavailable?: boolean;
    readonly message?: string;
}
/**
 * Archive or restore one Session.
 *
 * @param workspaces - the client Workspace service, when the composition mounts one.
 * @param sessionId - the Session to move between the two sets.
 * @param archived - which set it should end in.
 * @param stopActivity - ask the Host to stop running work instead of refusing.
 * @returns the outcome the panel renders.
 */
export declare function setSessionArchived(workspaces: any, sessionId: string, archived: boolean, stopActivity: boolean): Promise<ArchiveResult>;
//# sourceMappingURL=archive.d.ts.map