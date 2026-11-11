/**
 * Locale entry point for the terminal tab.
 *
 * One file per language in `locales/`, this module only re-exports them and
 * derives the namespace key union from the Chinese source of truth. Every
 * user-visible string this package owns is declared there and resolved through
 * the Client `locale` service, so the tab follows the GUI's language switch
 * instead of freezing the language it was first rendered in.
 *
 * The ids are the shell's own (`zh`, `en`, `ja`, `es`, `fr`, `de`, `ru`, `pt`),
 * so a language picked in Settings reaches this package without a mapping
 * table. `zh` and `en` are the locale service's required baselines; the rest
 * are optional ids, each still checked against this same key union — a key
 * added to one dictionary fails every other one at compile time, which is the
 * point: a missing translation is a build error, not a key name shown to the
 * user.
 */
import { zh } from './locales/zh.js';
import { en } from './locales/en.js';
import { ja } from './locales/ja.js';
import { es } from './locales/es.js';
import { fr } from './locales/fr.js';
import { de } from './locales/de.js';
import { ru } from './locales/ru.js';
import { pt } from './locales/pt.js';
export { zh, en, ja, es, fr, de, ru, pt };
/** The namespace these dictionaries occupy in the Client locale registry. */
export declare const NS = "dsh-cool-terminal";
/** One locale id the shell can switch to. */
export type LocaleId = 'zh' | 'en' | 'ja' | 'es' | 'fr' | 'de' | 'ru' | 'pt';
/** The terminal tab's key union, derived from the Chinese dictionary. */
export type TerminalKey = keyof typeof zh;
/** Values substituted into a template's `{name}` placeholders. */
export type LocaleParams = Record<string, string | number>;
/**
 * A bound translator.
 *
 * Reads the active dictionary at call time, so a function that holds one (a
 * stream handler, the tab-label thunk) speaks whatever language is in force
 * when it runs.
 */
export type Translate = (key: TerminalKey, params?: LocaleParams) => string;
/**
 * A namespace's dictionaries: the two required baselines plus whichever
 * optional locales are translated.
 */
export type LocaleDictionaries = {
    zh: Record<string, string>;
    en: Record<string, string>;
} & Partial<Record<LocaleId, Record<string, string>>>;
/**
 * The slice of the Client `locale` service this package uses.
 *
 * Declared structurally so this package needs no module dependency on the
 * locale package, the same way `WorkspaceSourceLike` stands in for the
 * Workspace controller.
 */
export interface LocaleServiceLike {
    /** Register a namespace's built-in dictionaries; returns their disposer. */
    register(ns: string, dicts: LocaleDictionaries): () => void;
    /** Bind a namespace to a translator that reads the active locale per call. */
    bind(ns: string): (key: string, params?: LocaleParams) => string;
}
/** Every dictionary, in the shape the locale service registers. */
export declare const DICTIONARIES: LocaleDictionaries;
/**
 * The translator a composition without the locale service falls back to.
 *
 * It answers the first language the browser asks for that this package
 * translates — Chinese for a `zh*` tag, Japanese for `ja*`, and so on — and
 * English when none of them match.
 */
export declare function browserTranslate(): Translate;
/**
 * A translator bound to the Client locale service.
 *
 * Interpolation is the service's own, so a parameter value is never substituted
 * a second time.
 */
export declare function serviceTranslate(locale: LocaleServiceLike): Translate;
//# sourceMappingURL=locales.d.ts.map