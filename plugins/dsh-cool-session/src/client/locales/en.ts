/**
 * English dictionary — the key set every other dictionary is checked against.
 *
 * `UiKey` in `locales.ts` lists every key the page may draw; this object must
 * carry exactly that set plus the refusal codes, and each other locale is typed
 * `Record<MessageKey, string>`, so a forgotten or invented key is a compile
 * error rather than a blank label at runtime.
 */

import type { MessageKey } from '../locales.js'

export const en = {
  'action.delete': 'Delete session',
  'action.cancel': 'Cancel',
  'action.close': 'Close',

  'settings.nav': 'Sessions',
  'settings.title': 'Sessions',
  'settings.description': 'Search, filter, archive, or delete sessions.',

  'sessions.search': 'Search session titles',
  'sessions.searchPlaceholder': 'Search...',
  'sessions.allWorkspaces': 'All workspaces',
  'sessions.noWorkspace': 'No workspace',
  'sessions.allSessions': 'All sessions',
  'sessions.unarchived': 'Unarchived',
  'sessions.archived': 'Archived',
  'sessions.running': 'Running',
  'sessions.selectAll': 'Select all',
  'sessions.selectOne': 'Select {title}',
  'sessions.archiveSelected': 'Archive selected',
  'sessions.deleteSelected': 'Delete selected',
  'sessions.selectedCount': '{count} selected',
  'sessions.columnTitle': 'Session',
  'sessions.columnStatus': 'Status',
  'sessions.columnActions': 'Actions',
  'sessions.archive': 'Archive',
  'sessions.unarchive': 'Unarchive',
  'sessions.delete': 'Delete',

  'sessions.loading': 'Loading sessions…',
  'sessions.empty': 'No sessions yet',
  'sessions.noMatches': 'No matching sessions',
  'sessions.loadFailed': 'The session list could not be loaded',
  'sessions.retry': 'Retry',
  'sessions.unavailable': 'Session services are not ready, so the archive action is unavailable',
  'sessions.actionFailed': 'The action failed',
  'sessions.bulkPartial.one': 'Deleted 1 session; {failed} could not be deleted.',
  'sessions.bulkPartial.other': 'Deleted {deleted} sessions; {failed} could not be deleted.',
  'sessions.bulkStopped.one': 'Deleted 1 session; the rest could not be processed.',
  'sessions.bulkStopped.other': 'Deleted {deleted} sessions; the rest could not be processed.',
  'sessions.bulkArchivePartial.one': 'Archived 1 session; {skipped} skipped because work was still running.',
  'sessions.bulkArchivePartial.other': 'Archived {archived} sessions; {skipped} skipped because work was still running.',
  'sessions.bulkArchiveFailed.one': 'Archived 1 session; {failed} could not be archived.',
  'sessions.bulkArchiveFailed.other': 'Archived {archived} sessions; {failed} could not be archived.',

  'sessions.deleteSelectedTitle': 'Delete selected sessions',
  'sessions.deleteBatchDescription': 'This removes the {count} selected sessions and all of their subagent sessions from disk, including their logs. Running sessions will be terminated. This cannot be undone!',

  'sessions.archiveStopTitle': 'Stop and archive this session?',
  'sessions.archiveStopDescription': '“{title}” still has work in progress. Archiving stops it first; the stopped work will not resume on its own.',
  'sessions.archiveActivity': 'Work that will be stopped',
  'sessions.activityTurn': 'The turn in progress',
  'sessions.activitySubagents.one': '1 running subagent',
  'sessions.activitySubagents.other': '{count} running subagents',
  'sessions.activityJobs.one': '1 background job',
  'sessions.activityJobs.other': '{count} background jobs',
  'sessions.activitySchedules.one': '1 scheduled reminder',
  'sessions.activitySchedules.other': '{count} scheduled reminders',
  'sessions.activityOther.one': '1 other item of work ({kind})',
  'sessions.activityOther.other': '{count} other items of work ({kind})',
  'sessions.archiveStopAction': 'Stop and archive',
  'sessions.archiveStopPending': 'Stopping and archiving…',

  'delete.title': 'Delete session',
  'delete.description': 'This removes this session and all of its subagent sessions from disk, including their logs. Running sessions will be terminated. This cannot be undone!',
  'delete.pending': 'Stopping and deleting…',
  'delete.confirm': 'Delete',

  'error.host-stale': 'The Host half is still running an older build; restart DSH and try again.',

  'error.missing-session': 'No session was named',
  'error.unknown-session': 'That session no longer exists',
  'error.subagent-delete': 'A subagent session cannot be deleted on its own; delete its parent conversation',
  'error.delete-failed': 'The session could not be deleted',
  'error.delete-unsupported': 'This Harness does not expose the on-disk session layout needed for deletion',
  'error.delete-active': 'The session is still running ({activity}) and could not be stopped, so it was not deleted',
  'error.session-live': 'The session is still live and could not be released',
  'error.delete-partial': 'Some sessions could not be deleted: {deleted} removed, {remaining} still present. Retry the remaining ones',
  'error.session-running': 'The session is still running and could not be archived',
  'error.activityFallback': 'work in progress',
  'activity.turn': 'the turn in progress',
  'activity.subagent': 'running subagents',
  'activity.job': 'background jobs',
  'activity.schedule': 'scheduled reminders',
  'activity.separator': ', ',
} satisfies Record<MessageKey, string>
