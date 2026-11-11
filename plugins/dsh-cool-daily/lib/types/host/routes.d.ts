/**
 * The Host half's HTTP surface.
 *
 * The browser half has no Cordis context of its own, so every question it asks
 * crosses a same-origin route registered on the `webServer` carrier. Each route
 * answers JSON and never rejects: a transport or service failure becomes an
 * `{ ok: false }` result the page draws in its own error state.
 *
 * The Host stays authoritative about the data: the page names an article id but
 * never a directory, and settings are validated on the way in rather than trusted
 * from the browser.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
export declare function sendJson(res: ServerResponse, status: number, body: unknown): void;
/**
 * Reject a cross-site request.
 *
 * These routes read and write this user's own article directory, so a page on
 * another origin has no business asking. A same-origin `fetch` omits `Origin` on
 * some requests, so an absent header is allowed.
 */
export declare function sameOrigin(req: IncomingMessage): boolean;
/**
 * Register every route under the plugin prefix.
 *
 * The prefix handler is tied to the plugin's fiber by the caller, so stopping or
 * reloading the plugin takes its routes down with it.
 *
 * @param ctx - the Host plugin context exposing `webServer`.
 * @returns the disposer that unregisters the prefix.
 */
export declare function registerRoutes(ctx: any): () => void;
//# sourceMappingURL=routes.d.ts.map