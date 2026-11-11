/**
 * The Host half's HTTP surface.
 *
 * The browser half has no Cordis context and no remote namespace of its own, so
 * every question it asks the Host crosses a same-origin route registered on the
 * `webServer` carrier. Each route answers JSON and never rejects: a transport or
 * service failure becomes an `{ ok: false }` result the page draws in its own
 * error state.
 *
 * The Host stays authoritative about *which* workspace is browsed. A request may
 * name the session it belongs to, but never a directory: the root is read from
 * that session's own header, so a page cannot point the plugin at a tree the
 * session does not own. Three routes read; the fourth is the editor's save, and
 * it accepts nothing but the text of one file already inside that workspace.
 */
/** Route table, kept in one place so the two halves cannot drift. */
export declare const ROUTES: {
    readonly list: "/dsh-cool-file/api/list";
    readonly read: "/dsh-cool-file/api/read";
    readonly text: "/dsh-cool-file/api/text";
    readonly write: "/dsh-cool-file/api/write";
};
/**
 * Register the four routes on the browser HTTP carrier.
 *
 * @param ctx - the Host plugin context.
 * @returns the disposer that removes the routes with the plugin.
 */
export declare function registerRoutes(ctx: any): () => void;
//# sourceMappingURL=routes.d.ts.map