/**
 * Generation: one model call per batch, turned into Markdown files.
 *
 * The Host asks the currently selected default model for a JSON array of
 * articles, validates what came back, and writes each article through the
 * article store. The call goes through `ctx.llm` directly rather than through a
 * Session, so a daily batch costs one request and leaves no conversation
 * behind — and so the scheduler can run with no Session at all.
 *
 * The prompt asks for Markdown; the model's answer is parsed into title,
 * category, and body. A malformed answer is not thrown away: the body is kept as
 * one article so a partial result still reaches the page, and the parse problem
 * becomes a notice rather than an empty day.
 */
import type { DailyModel, ArticleSummary } from '../shared/contract.js';
import { type GeneratedArticle } from './articles.js';
/** The in-memory generation state the page polls. */
interface GenerationRuntime {
    generating: boolean;
    lastError: string | null;
    lastFinishedAt: string | null;
}
/** Read the current in-memory generation state. */
export declare function generationState(): Readonly<GenerationRuntime>;
/** One complete model call, shaped by the caller's prompt. */
export interface LlmCallOptions {
    /** The system message. */
    system: string;
    /** The single user message. */
    user: string;
    /** Answer cap, in tokens. */
    maxTokens: number;
    /** Sampling temperature. */
    temperature: number;
    /** How long the call may run before it is cancelled. */
    timeoutMs: number;
    /** The route to call; omitted or null follows DSH's current default. */
    model?: DailyModel | null;
}
/**
 * Run one model call and return its complete text.
 *
 * The stream is drained into one string; a terminal `error` or `aborted` chunk
 * becomes a thrown error, and a stream that ends without any terminal chunk is
 * treated as a failure instead of a silent empty answer. The call is stateless:
 * nothing here belongs to a Session.
 */
export declare function callLlmText(ctx: any, options: LlmCallOptions): Promise<string>;
/**
 * Parse the model's answer into at most `count` articles.
 *
 * The answer may be bare JSON or a fenced block; both are accepted. When
 * nothing usable comes back, the raw text is kept as one article so the day is
 * not silently empty.
 */
export declare function parseGenerated(raw: string, count: number, date: string): GeneratedArticle[];
/**
 * Generate and store one batch.
 *
 * Only one batch runs at a time: the scheduler and the page's manual button
 * share this guard, so a second request is refused instead of doubling the
 * model bill. The returned summary is the stored articles, newest last.
 */
export declare function generateNow(ctx: any): Promise<{
    ok: true;
    articles: ArticleSummary[];
} | {
    ok: false;
    error: string;
}>;
/**
 * Start one batch in the background.
 *
 * Routes and the scheduler both call this: the HTTP answer returns immediately
 * and the page follows progress through the state route, so a slow model call
 * never holds a request open or blocks the browser.
 *
 * @returns false when a batch was already running, so the caller can tell the
 *   user their click was not queued.
 */
export declare function startGeneration(ctx: any): boolean;
export {};
//# sourceMappingURL=generate.d.ts.map