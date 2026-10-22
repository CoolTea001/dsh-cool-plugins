/**
 * Host entry for dsh-cool-session.
 *
 * The browser half owns the native Session-menu row and its confirmation; this
 * half owns the one destructive artifact operation behind that confirmation.
 * Every question the page asks crosses a same-origin HTTP route served by the
 * `webServer` carrier, because an out-of-tree bundle cannot generate a
 * `ctx.remote` namespace and its Client half never sees the Host Cordis context.
 *
 * The Session and Agent capabilities are read per request rather than declared
 * as hard dependencies: a composition without them still loads the plugin and
 * answers one clear refusal instead of failing the menu row.
 */
export declare const name = "dsh-cool-session";
/** The web carrier is a hard dependency: without it there is no route to serve. */
export declare const inject: string[];
/** The route table, exported so a probe or test can address the route by name. */
export { ROUTES } from './routes.js';
export declare function apply(ctx: any): void;
//# sourceMappingURL=index.d.ts.map