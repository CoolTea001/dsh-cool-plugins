/**
 * The Daily Post page.
 *
 * The page is a thin, honest projection of the Host's state: it lists the
 * Markdown files the Host has written, filters them locally, and follows a
 * running generation by polling the state route while the Host reports one. It
 * never writes an article itself — the manual button only asks the Host to start
 * a batch, and the settings dialog only stores the prompt, batch size, repeat
 * days, and model the Host schedules from.
 */
import * as React from 'react';
import type { Translate } from './locales.js';
/** The props the shell hands a root-scoped main panel whose registration names this locale. */
export interface DailyPageProps {
    /** The plugin's translate seat, read at render time so a language switch re-renders. */
    t: Translate;
}
/**
 * Render the Daily Post page.
 * @param props - the plugin's translate seat.
 * @returns the page frame: heading, toolbar, article list, and the reader.
 */
export declare function DailyPage({ t }: DailyPageProps): React.ReactElement;
//# sourceMappingURL=page.d.ts.map