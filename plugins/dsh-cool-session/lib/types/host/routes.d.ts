/**
 * The Host half's HTTP surface.
 *
 * The browser half has no Cordis context and no remote namespace of its own, so
 * the destructive command crosses same-origin routes registered on the
 * `webServer` carrier: one Session per request from the native menu, and one
 * selection per request from the management panel. The routes answer JSON and
 * never reject: a transport, service, or filesystem failure becomes an
 * `{ ok: false }` result the page reports in place.
 *
 * The Host stays authoritative about *what* is deleted. A request names a
 * Session id but never a directory or an Agent: the artifact path is derived and
 * verified by `deletion.ts`, never by the caller. That keeps the page a
 * management surface over DSH's own state rather than a second source of truth.
 */
/** Route table, kept in one place so the two halves cannot drift. */
export declare const ROUTES: {
    readonly delete: "/dsh-cool-session/api/delete";
    readonly deleteMany: "/dsh-cool-session/api/delete-many";
};
/**
 * Serve the deletion routes for one plugin instance.
 *
 * @param ctx - the Host plugin context.
 * @returns a disposer that unregisters exactly this route.
 */
export declare function registerRoutes(ctx: any): () => void;
//# sourceMappingURL=routes.d.ts.map