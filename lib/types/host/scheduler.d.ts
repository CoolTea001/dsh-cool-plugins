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
/**
 * Start the periodic check and return its disposer.
 *
 * The first check runs shortly after load so a Host started at 09:00 still
 * catches up on the day; the interval takes over from there.
 *
 * @param ctx - the Host plugin context, used to resolve the model route later.
 * @returns the disposer that stops both timers.
 */
export declare function startScheduler(ctx: any): () => void;
//# sourceMappingURL=scheduler.d.ts.map