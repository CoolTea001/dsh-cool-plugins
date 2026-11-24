/**
 * The Host half's HTTP surface.
 *
 * The browser half has no Cordis context and no remote namespace of its own, so
 * every question it asks the Host crosses a same-origin route registered on the
 * `webServer` carrier. Each route answers JSON and never rejects: a transport or
 * service failure becomes an `{ ok: false }` result the page draws in its own
 * error state. The one exception is the raw route, which answers bytes rather
 * than JSON because its caller is an `<img>` that cannot read either.
 *
 * The Host stays authoritative about *which* workspace is browsed. A request may
 * name the session it belongs to, but never a directory: the root is read from
 * that session's own header, so a page cannot point the plugin at a tree the
 * session does not own. Five routes read; the save is the editor's one write,
 * and it accepts nothing but the text of one file already inside that workspace.
 *
 * The last four are the tree's context-menu commands — rename, create, delete,
 * reveal — and they are the only routes that change what is on disk. Each is a
 * path plus, for the two that need one, a single name: the fence that decides
 * whether the path is inside the session's workspace and whether the policy
 * allows a write lives in the module that performs the change, so a route here
 * carries the request and nothing else.
 */
/**
 * Route table, kept in one place so the two halves cannot drift.
 *
 * Five read, one edits, four change the tree: the row commands the context menu
 * offers. Every one of them answers JSON and never rejects, and every one of
 * them is fenced by the session's own workspace and sandbox policy.
 */
export declare const ROUTES: {
    readonly list: "/dsh-cool-file/api/list";
    readonly read: "/dsh-cool-file/api/read";
    readonly text: "/dsh-cool-file/api/text";
    readonly write: "/dsh-cool-file/api/write";
    readonly raw: "/dsh-cool-file/api/raw";
    readonly rename: "/dsh-cool-file/api/rename";
    readonly create: "/dsh-cool-file/api/create";
    readonly remove: "/dsh-cool-file/api/delete";
    readonly reveal: "/dsh-cool-file/api/reveal";
};
/**
 * Register every route on the browser HTTP carrier.
 *
 * @param ctx - the Host plugin context.
 * @returns the disposer that removes the routes with the plugin.
 */
export declare function registerRoutes(ctx: any): () => void;
//# sourceMappingURL=routes.d.ts.map