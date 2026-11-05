/**
 * Where dsh-cool-daily keeps its data.
 *
 * The same convention the other cool plugins use: `$DSH_HOME/cool-daily`, with
 * `DSH_HOME` winning and `~/.dsh` as the fallback. The articles directory is the
 * plugin's durable output — Markdown files a user can open in any editor — so it
 * is a visible directory rather than an opaque store.
 */
/** The harness home, resolved the way the rest of DSH resolves it. */
export declare function harnessHome(): string;
/** Root of this plugin's data. */
export declare function dataRoot(): string;
/** The Markdown article directory. */
export declare function articlesDir(): string;
/** The settings document. */
export declare function settingsPath(): string;
/** The read receipts: which articles the reader has already opened. */
export declare function readsPath(): string;
//# sourceMappingURL=paths.d.ts.map