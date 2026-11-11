/**
 * Host entry for dsh-cool-daily.
 *
 * This half owns the articles and the model call behind them. It answers the
 * browser through same-origin HTTP routes (the browser half has no Cordis
 * context) and runs the daily check on a timer. Settings and Markdown files live
 * under `$DSH_HOME/cool-daily`, next to the other cool plugins' data, so the
 * generated articles are ordinary files the user can open and keep.
 */
export declare const name = "dsh-cool-daily";
/** The web carrier is a hard dependency: without it there is no route to serve. */
export declare const inject: string[];
export declare function apply(ctx: any): void;
//# sourceMappingURL=index.d.ts.map