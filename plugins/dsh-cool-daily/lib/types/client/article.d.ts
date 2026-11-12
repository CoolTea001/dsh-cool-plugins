/**
 * The article reader.
 *
 * One article is fetched by id when the reader opens, so the list payload stays
 * small however many days the directory holds. The Markdown body renders through
 * the plugin's own renderer — React elements, never injected HTML.
 */
import * as React from 'react';
import type { Translate } from './locales.js';
/** The props the page hands the reader. */
export interface ArticleViewProps {
    /** The plugin's translate seat. */
    t: Translate;
    /** The article to read. */
    id: string;
    /** Return to the list. */
    onBack: () => void;
}
/**
 * Render one article.
 * @param props - article id and the back action.
 * @returns the article header, metadata, and rendered body.
 */
export declare function ArticleView({ t, id, onBack }: ArticleViewProps): React.ReactElement;
//# sourceMappingURL=article.d.ts.map