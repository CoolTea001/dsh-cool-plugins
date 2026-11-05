/**
 * The wire contract shared by both halves of dsh-cool-daily.
 *
 * The Host owns every durable value: the settings file, the article directory,
 * and the model call that fills it. The browser half only ever sees these
 * detached records, so this module is the one place where a field may be added
 * without the two sides drifting.
 */
/** One article as the list needs it: everything except the Markdown body. */
export interface ArticleSummary {
    /** Stable id, equal to the Markdown file's name without its extension. */
    id: string;
    /** Display title, from the file's front matter. */
    title: string;
    /** Local calendar day the article belongs to, `YYYY-MM-DD`. */
    date: string;
    /** Short category label, from the file's front matter. */
    category: string;
    /** ISO instant the file was written. */
    createdAt: string;
    /** Plain-text opening of the body, for the list card. */
    excerpt: string;
    /** Content tags: from the file's front matter, or derived from its headings. */
    tags: string[];
    /** Whether the reader has already opened this article. */
    read: boolean;
}
/** One article with its Markdown body. */
export interface ArticleDetail extends ArticleSummary {
    content: string;
}
/** One provider/model route the generator may call. */
export interface DailyModel {
    /** Registered provider id, as the Host LLM service names it. */
    provider: string;
    /** Provider-owned model id. */
    model: string;
    /** The reasoning level this route pins, as the adapter spells it. */
    reasoningEffort?: string;
}
/** One model row inside a provider group. */
export interface ModelOption {
    /** Provider-owned id, the value a selection stores. */
    id: string;
    /** Display name the adapter declares. */
    name: string;
}
/** One provider and the models it currently offers. */
export interface ModelGroup {
    /** Registered provider id. */
    provider: string;
    /** Display name, falling back to the id. */
    name: string;
    /** Models in catalog order. */
    models: ModelOption[];
}
/** Everything the settings panel may change. */
export interface DailySettings {
    /** The topic instruction the model receives, in the user's own words. */
    prompt: string;
    /** Articles requested per generation, 1-10. */
    count: number;
    /** Repeat days as `Date#getDay()` values, 0 = Sunday. Empty means manual only. */
    days: number[];
    /** The route this plugin writes with; null follows DSH's current default. */
    model: DailyModel | null;
}
/** The reasoning levels one route offers, read from its adapter. */
export type ModelEffortsPayload = {
    ok: true;
    efforts: string[];
} | {
    ok: false;
    error: string;
};
/** The model catalog answer: what the picker may offer, and the current default. */
export interface ModelsPayload {
    ok: true;
    groups: ModelGroup[];
    /** DSH's current default selection, shown when this plugin follows it. */
    current: DailyModel | null;
}
/** The state payload the page polls while a generation is running. */
export interface DailyStatePayload {
    ok: true;
    settings: DailySettings;
    articles: ArticleSummary[];
    generating: boolean;
    lastError: string | null;
}
/** The settings write answer. */
export interface SettingsPayload {
    ok: true;
    settings: DailySettings;
}
/** The article read answer. */
export interface ArticlePayload {
    ok: true;
    article: ArticleDetail;
}
/** The answer to recording that one article was opened. */
export interface ReadPayload {
    ok: true;
    read: true;
}
/** Every route below this prefix is owned by this plugin. */
export declare const API_PREFIX = "/dsh-cool-daily/api";
/** Route paths, kept in one place so both halves address the same surface. */
export declare const API_PATHS: {
    readonly state: "/dsh-cool-daily/api/state";
    readonly settings: "/dsh-cool-daily/api/settings";
    readonly generate: "/dsh-cool-daily/api/generate";
    readonly article: "/dsh-cool-daily/api/article";
    readonly read: "/dsh-cool-daily/api/read";
    readonly models: "/dsh-cool-daily/api/models";
    readonly efforts: "/dsh-cool-daily/api/efforts";
};
/** Oldest hour of the local day at which automatic generation may run. */
export declare const AUTO_GENERATION_HOUR = 8;
//# sourceMappingURL=contract.d.ts.map