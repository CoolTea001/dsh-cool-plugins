/**
 * The Sessions section of the Settings panel.
 *
 * The shell builds its navigation from `settings.section` entries, so this
 * plugin contributes one there instead of reaching into the panel's DOM. The
 * section is placed between Models and Built-in plugins and currently only
 * names itself: the management surface is deliberately absent until the
 * feature behind it exists.
 *
 * The copy is read through the locale seat at render time, which is what lets
 * the heading follow a language switch without reopening Settings.
 */
import type { ReactElement } from 'react';
import type { Translate } from './locales.js';
/** The section's injected share: the locale seat, for now nothing else. */
interface SessionsSectionProps {
    readonly t: Translate;
}
/**
 * Render the empty Sessions page.
 *
 * @param props - the section's locale seat.
 * @returns the section element tree.
 */
export declare function SessionsSection({ t }: SessionsSectionProps): ReactElement;
export {};
//# sourceMappingURL=settings-section.d.ts.map