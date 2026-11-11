/**
 * The daily scheduler.
 *
 * DSH has no cron for this plugin, and a durable reminder is a Session feature
 * this page does not own, so the Host checks the clock once a minute instead:
 * when today is one of the selected weekdays, the local hour has reached
 * {@link AUTO_GENERATION_HOUR}, no article exists for today yet, and nothing is
 * already generating, one batch starts.
 *
 * The check is idempotent and stateless — "does today have an article?" is read
 * from the article directory, not from a private cursor — so a restart, a
 * long-closed laptop, or a changed schedule all converge on the same answer. A
 * failed batch retries after a cooldown rather than every minute.
 */

import { AUTO_GENERATION_HOUR } from '../shared/contract.js'
import { listArticles, localDate } from './articles.js'
import { generationState, startGeneration } from './generate.js'
import { readSettings } from './settings.js'

/** How often the clock is checked. */
const CHECK_INTERVAL_MS = 60_000

/** The first check waits for the Host to finish booting. */
const INITIAL_CHECK_MS = 5_000

/** No retry sooner than this after a failed automatic batch. */
const RETRY_COOLDOWN_MS = 10 * 60_000

let lastAttempt = 0

/**
 * Run one clock check.
 *
 * Every early return is a reason not to generate: no repeat day selected, today
 * not selected, too early in the day, a batch already running, a recent failure,
 * or an article already written for today.
 */
async function check(ctx: any): Promise<void> {
  const settings = await readSettings()
  if (settings.days.length === 0) return
  const now = new Date()
  if (!settings.days.includes(now.getDay())) return
  if (now.getHours() < AUTO_GENERATION_HOUR) return
  if (generationState().generating) return
  if (Date.now() - lastAttempt < RETRY_COOLDOWN_MS) return
  const today = localDate(now)
  const articles = await listArticles()
  if (articles.some(article => article.date === today)) return
  lastAttempt = Date.now()
  startGeneration(ctx)
}

/**
 * Start the periodic check and return its disposer.
 *
 * The first check runs shortly after load so a Host started at 09:00 still
 * catches up on the day; the interval takes over from there.
 *
 * @param ctx - the Host plugin context, used to resolve the model route later.
 * @returns the disposer that stops both timers.
 */
export function startScheduler(ctx: any): () => void {
  let running = false
  const run = (): void => {
    if (running) return
    running = true
    void check(ctx)
      .catch(() => { /* a failed check must not stop the scheduler */ })
      .finally(() => { running = false })
  }
  const initial = setTimeout(run, INITIAL_CHECK_MS)
  const interval = setInterval(run, CHECK_INTERVAL_MS)
  return () => {
    clearTimeout(initial)
    clearInterval(interval)
  }
}
