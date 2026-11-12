/**
 * The settings document.
 *
 * A missing or unreadable file reads as the defaults rather than failing the
 * page: settings are a preference, and a half-written JSON file must not take
 * the Daily Post page down. Every write is validated and clamped here so the
 * browser cannot hand the model an unbounded prompt or a thousand articles.
 */
import type { DailySettings } from '../shared/contract.js';
/** What a fresh install generates from, until the user edits the prompt. */
export declare const DEFAULT_PROMPT = "\u56F4\u7ED5\u79D1\u6280\u3001\u5B66\u4E60\u4E0E\u6548\u7387\uFF0C\u5199\u4E00\u7BC7\u80FD\u5E26\u6765\u65B0\u89C6\u89D2\u7684\u77ED\u6587\uFF1A\u6709\u4E00\u4E2A\u5177\u4F53\u7684\u89C2\u70B9\uFF0C\u5E76\u7528\u53EF\u9760\u7684\u4F8B\u5B50\u6216\u65B9\u6CD5\u652F\u6491\u5B83\u3002";
/** A fresh install generates one article every day; the user may deselect days. */
export declare const DEFAULT_SETTINGS: DailySettings;
/** Coerce one stored or submitted settings record into the accepted shape. */
export declare function normalizeSettings(value: unknown): DailySettings;
/** Read the stored settings, falling back to the defaults. */
export declare function readSettings(): Promise<DailySettings>;
/**
 * Validate and persist one settings record, then return what was stored.
 *
 * The write goes through a sibling temporary file and a rename so a crash
 * midway leaves the previous document intact instead of a truncated one.
 */
export declare function writeSettings(value: unknown): Promise<DailySettings>;
//# sourceMappingURL=settings.d.ts.map