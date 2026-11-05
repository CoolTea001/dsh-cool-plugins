/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the page draws in its own error state, so the page has
 * exactly one failure shape no matter how the answer went wrong.
 */
import { type ArticlePayload, type DailySettings, type DailyStatePayload, type SettingsPayload } from '../shared/contract.js';
/** Any answer: the success payload, or the one failure shape above. */
type Answer<T> = T | {
    ok: false;
    error: string;
};
/** Read settings, articles, and the current generation state. */
export declare function fetchState(): Promise<Answer<DailyStatePayload>>;
/** Persist the complete settings record. */
export declare function saveSettings(settings: DailySettings): Promise<Answer<SettingsPayload>>;
/** Ask the Host to start one manual batch. */
export declare function startGeneration(): Promise<Answer<{
    ok: true;
    started: true;
}>>;
/** Read one article body by id. */
export declare function fetchArticle(id: string): Promise<Answer<ArticlePayload>>;
export {};
//# sourceMappingURL=api.d.ts.map