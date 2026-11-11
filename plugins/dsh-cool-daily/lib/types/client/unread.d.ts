/**
 * Shared unread count behind the sidebar entry's dot.
 *
 * The Host generates on its own schedule, so the entry cannot learn about a new
 * article from the page: the sidebar row is rendered outside the main panel, and
 * the generation happens while that panel is closed or showing something else.
 * The count therefore lives in the entry's own subscription — a slow poll of the
 * state route, a re-read whenever the window is focused again, and an event the
 * page fires after it changes something the count depends on (opening an article
 * marks it read, deleting removes it).
 *
 * The entry never caches the articles themselves: only the number matters here,
 * and the page keeps the list it already renders.
 */
/**
 * Tell the sidebar entry that the unread set probably changed.
 *
 * Cheap enough to fire on every mutation: listeners re-read the count from one
 * route rather than being handed the new value, so a missed event can only
 * delay the dot, never put it out of step.
 */
export declare function notifyUnreadChanged(): void;
/**
 * Follow the number of unread articles.
 *
 * @returns the count, 0 until the first answer arrives and after any failure
 * (an unreachable Host has no articles to announce).
 */
export declare function useUnreadCount(): number;
//# sourceMappingURL=unread.d.ts.map