/**
 * Russian dictionary, checked complete against the `MessageKey` union.
 *
 * Terminology follows the shell's own dictionaries: «сеанс» for a session,
 * «рабочая область», «архивировать / разархивировать», «субагент».
 *
 * Russian has more plural forms than the two the locale service chooses
 * between, so the `.other` spelling is phrased to read correctly for any count
 * above one rather than agreeing with a numeral the caller may not pass.
 */
export declare const ru: {
    'action.delete': string;
    'action.cancel': string;
    'action.close': string;
    'settings.nav': string;
    'settings.title': string;
    'settings.description': string;
    'sessions.search': string;
    'sessions.searchPlaceholder': string;
    'sessions.allWorkspaces': string;
    'sessions.noWorkspace': string;
    'sessions.allSessions': string;
    'sessions.unarchived': string;
    'sessions.archived': string;
    'sessions.running': string;
    'sessions.selectAll': string;
    'sessions.selectOne': string;
    'sessions.archiveSelected': string;
    'sessions.deleteSelected': string;
    'sessions.selectedCount': string;
    'sessions.columnTitle': string;
    'sessions.columnStatus': string;
    'sessions.columnActions': string;
    'sessions.archive': string;
    'sessions.unarchive': string;
    'sessions.delete': string;
    'sessions.loading': string;
    'sessions.empty': string;
    'sessions.noMatches': string;
    'sessions.loadFailed': string;
    'sessions.retry': string;
    'sessions.unavailable': string;
    'sessions.actionFailed': string;
    'sessions.bulkPartial.one': string;
    'sessions.bulkPartial.other': string;
    'sessions.bulkStopped.one': string;
    'sessions.bulkStopped.other': string;
    'sessions.bulkArchivePartial.one': string;
    'sessions.bulkArchivePartial.other': string;
    'sessions.bulkArchiveFailed.one': string;
    'sessions.bulkArchiveFailed.other': string;
    'sessions.deleteSelectedTitle': string;
    'sessions.deleteBatchDescription': string;
    'sessions.archiveStopTitle': string;
    'sessions.archiveStopDescription': string;
    'sessions.archiveActivity': string;
    'sessions.activityTurn': string;
    'sessions.activitySubagents.one': string;
    'sessions.activitySubagents.other': string;
    'sessions.activityJobs.one': string;
    'sessions.activityJobs.other': string;
    'sessions.activitySchedules.one': string;
    'sessions.activitySchedules.other': string;
    'sessions.activityOther.one': string;
    'sessions.activityOther.other': string;
    'sessions.archiveStopAction': string;
    'sessions.archiveStopPending': string;
    'delete.title': string;
    'delete.description': string;
    'delete.pending': string;
    'delete.confirm': string;
    'error.host-stale': string;
    'error.missing-session': string;
    'error.unknown-session': string;
    'error.subagent-delete': string;
    'error.delete-failed': string;
    'error.delete-unsupported': string;
    'error.delete-active': string;
    'error.session-live': string;
    'error.delete-partial': string;
    'error.session-running': string;
    'error.activityFallback': string;
    'activity.turn': string;
    'activity.subagent': string;
    'activity.job': string;
    'activity.schedule': string;
    'activity.separator': string;
};
//# sourceMappingURL=ru.d.ts.map