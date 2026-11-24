/**
 * The fences every route stands behind, in one place.
 *
 * Four facts are asked of every request the page makes — which workspace it
 * belongs to, which workspace path it names, which process path that resolves
 * to, and which sandbox policy the write may run under — and each of them has
 * exactly one right answer rather than one per route. Keeping them here means a
 * read route and a mutation route cannot drift apart about what "inside the
 * workspace" means, and a new route inherits the whole fence by asking the same
 * three questions.
 *
 * Nothing in this module touches the plugin's own state: it reads the session
 * header, the composed filesystem and the sandbox policy, and answers with
 * plain values.
 */
/** A stand-in session identity for a request that named none. */
export declare const LOCAL_SESSION = "local";
/**
 * The session's own workspace root.
 *
 * Live header first, then the durable header of a session the Host has not
 * resumed yet, then the executor's default directory. Every read is
 * best-effort: an unreadable store is not a route's answer to give.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the absolute workspace root, or undefined when none can be named.
 */
export declare function resolveRoot(ctx: any, sessionId: unknown): Promise<string | undefined>;
/**
 * The header-derived scope the workspace service expects.
 *
 * @param sessionId - the session the page belongs to, when it named one.
 * @param root - the session's absolute workspace root.
 * @returns the scope for one request.
 */
export declare function scopeOf(sessionId: unknown, root: string): {
    sessionId: string;
    workspaceRoot: string;
};
/**
 * Read a path the page named as a workspace-relative `/`-separated path.
 *
 * Absolute paths and parent segments are refused here rather than passed on:
 * the tab's vocabulary is the workspace tree, and a route is not the place to
 * widen it.
 *
 * @param value - the raw body value.
 * @returns the normalized path, or undefined when it is not one.
 */
export declare function readPath(value: unknown): string | undefined;
/**
 * Read a name the page wants a new file or directory to have.
 *
 * A name is one path segment, never a path: a slash, a backslash, a NUL, an
 * empty string, `.` and `..` are all refused here, and the answer is the name
 * to create rather than a silent rewrite of it. Surrounding whitespace is
 * trimmed because a name that only looks empty would otherwise create a file
 * nobody can see in the tree.
 *
 * @param value - the raw body value.
 * @returns the name, or undefined when it is not one segment.
 */
export declare function readName(value: unknown): string | undefined;
/**
 * One failure, as the page's error state words it.
 *
 * @param error - whatever the service threw.
 * @returns the text the page draws.
 */
export declare function messageOf(error: unknown): string;
/**
 * The sandbox policy one write runs under.
 *
 * The session's own mode and `cwd` are the fence, exactly as they are for the
 * agent's write tool — the file tree must not be a way around a read-only
 * session. A request that names no live session has no policy to inherit; the
 * deployment default then applies, bounded by its own fallback root, and a
 * workspace the default does not cover is refused rather than quietly widened.
 *
 * @param ctx - the Host plugin context.
 * @param sessionId - the session the page belongs to, when it named one.
 * @returns the policy for this call, or undefined when no service owns one.
 */
export declare function policyFor(ctx: any, sessionId: unknown): unknown;
/**
 * The sandbox mode a policy carries, when it carries one.
 *
 * @param policy - whatever {@link policyFor} answered.
 * @returns the mode, or undefined when the policy is not an object with one.
 */
export declare function modeOf(policy: unknown): string | undefined;
/** Whether a caught error carries one of the filesystem service's stable codes. */
export declare function hasCode(error: unknown, code: string): boolean;
/**
 * The canonical process path of one target, when it is also a path on this host.
 *
 * Three facts have to agree before a path may be handed to a native operation:
 * the provider can spell it as a process path, the host can map that path back
 * into the provider's world, and the round trip lands on the same identity.
 * That is the same test the session controller applies before it opens a path
 * natively, and it is what keeps a remote or sandboxed workspace from having a
 * host filesystem operation applied to a path that merely looks like one.
 *
 * @param fs - the composed filesystem service.
 * @param target - the resolved target.
 * @returns the absolute process path, or undefined when the host cannot reach it.
 */
export declare function hostPathOf(fs: any, target: any): Promise<string | undefined>;
/**
 * The workspace path of one child, given its parent and its own name.
 *
 * @param parent - the parent's workspace path; empty for the root.
 * @param name - the child's own name.
 * @returns the child's workspace path.
 */
export declare function childPathOf(parent: string, name: string): string;
/**
 * The workspace path of the directory holding one path.
 *
 * @param path - a `/`-joined workspace path.
 * @returns the parent's path, or the empty string (the root).
 */
export declare function parentPathOf(path: string): string;
/**
 * Join one workspace path and one child name the way the Host spells a path.
 *
 * The tree's own vocabulary is `/`-joined, but the composed filesystem resolves
 * against the platform's spelling; `join` is what keeps the two apart — and
 * what makes a resolved target the same identity the listing reported.
 *
 * @param root - the absolute workspace root.
 * @param path - the workspace-relative path.
 * @returns the absolute path.
 */
export declare function absoluteOf(root: string, path: string): string;
//# sourceMappingURL=scope.d.ts.map