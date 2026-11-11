/**
 * Host entry for dsh-cool-file.
 *
 * The browser half owns the Files tab's rendering; this half owns the answer to
 * "what is in this session's workspace". Every read crosses a same-origin HTTP
 * route served by the `webServer` carrier, because an out-of-tree bundle cannot
 * generate a `ctx.remote` namespace and its Client half never sees the Host
 * Cordis context.
 *
 * The routed reads go through the composed `workspaceFiles` service rather than
 * touching `node:fs`: that service already resolves paths against the session's
 * own workspace root, confines directory listings to it, decodes text, and
 * refuses binary or oversized pages. This plugin therefore adds no filesystem
 * authority of its own.
 */

import { registerRoutes } from './routes.js'

export const name = 'dsh-cool-file'

/** The web carrier is a hard dependency: without it there is no route to serve. */
export const inject = ['webServer']

/** The route table, exported so a probe or test can address the routes by name. */
export { ROUTES } from './routes.js'

export function apply(ctx: any): void {
  // Tied to the plugin's fiber, so stopping or reloading the plugin takes its
  // routes down with it instead of leaving them answering for a dead instance.
  ctx.effect(() => registerRoutes(ctx), 'dsh-cool-file: routes')
}
