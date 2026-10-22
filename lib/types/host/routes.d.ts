/**
 * The Host half's HTTP surface.
 *
 * The browser half has no Cordis context and no remote namespace of its own, so
 * the one destructive command crosses a same-origin route registered on the
 * `webServer` carrier. The route answers JSON and never rejects: a transport,
 * service, or filesystem failure becomes an `{ ok: false }` result the dialog
 * reports in place.
 *
 * The Host stays authoritative about *what* is deleted. A request names a
 * Session id but never a directory or an Agent: the artifact path is derived and
 * verified by `deletion.ts`, never by the caller. That keeps the page a
 * management surface over DSH's own state rather than a second source of truth.
 */
/** Route table, kept in one place so the two halves cannot drift. */
export declare const ROUTES: {
    readonly delete: "/dsh-cool-session/api/delete";
};
/**
 * Serve the deletion route for one plugin instance.
 *
 * @param ctx - the Host plugin context.
 * @returns a disposer that unregisters exactly this route.
 */
export declare function registerRoutes(ctx: any): () => void;
//# sourceMappingURL=routes.d.ts.map