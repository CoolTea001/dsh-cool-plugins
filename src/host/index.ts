/**
 * Host entry for dsh-cool-daily.
 *
 * This half owns the articles and the model call behind them. It answers the
 * browser through same-origin HTTP routes (the browser half has no Cordis
 * context) and runs the daily check on a timer. Settings and Markdown files live
 * under `$DSH_HOME/cool-daily`, next to the other cool plugins' data, so the
 * generated articles are ordinary files the user can open and keep.
 */

import { registerRoutes } from './routes.js'
import { startScheduler } from './scheduler.js'

export const name = 'dsh-cool-daily'

/** The web carrier is a hard dependency: without it there is no route to serve. */
export const inject = ['webServer']

export function apply(ctx: any): void {
  // Tied to the plugin's fiber, so stopping or reloading the plugin takes its
  // routes and timer down with it instead of leaving them answering for a dead
  // instance.
  ctx.effect(() => registerRoutes(ctx), 'dsh-cool-daily: routes')
  ctx.effect(() => startScheduler(ctx), 'dsh-cool-daily: scheduler')
}
