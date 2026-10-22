/**
 * The confirmation's copy, in the two locales DSH ships.
 *
 * Every sentence the dialog draws lives here rather than at the point it is
 * drawn, for two reasons. The page is what knows the language to read in — the
 * Host does not — so a refusal reaches it as a code (see `shared/contract.ts`)
 * and is worded from the `error.<code>` entry below; and the locale service
 * re-renders the dialog when the language is switched, which only works if the
 * copy is looked up at render time through the `t` seat rather than captured in
 * a constant.
 *
 * The two dictionaries must carry exactly the same keys: `zh` is typed as
 * `typeof en`, so a key added to one and forgotten in the other is a compile
 * error rather than a dialog that falls back mid-sentence.
 */

import type { FailureCode } from '../shared/contract.js'

/** The dictionary namespace this page owns. */
export const NS = 'coolSession'

/** The copy of the menu row, the Settings page, the confirmations, and their refusals. */
type UiKey =
  /** The native Session menu's row. */
  | 'action.delete'
  /** The Settings navigation entry and the page behind it. */
  | 'settings.nav'
  | 'settings.title'
  | 'settings.description'
  /** The management panel's controls. */
  | 'sessions.search'
  | 'sessions.searchPlaceholder'
  | 'sessions.allWorkspaces'
  | 'sessions.noWorkspace'
  | 'sessions.allSessions'
  | 'sessions.unarchived'
  | 'sessions.archived'
  | 'sessions.running'
  | 'sessions.selectAll'
  | 'sessions.selectOne'
  | 'sessions.archiveSelected'
  | 'sessions.deleteSelected'
  | 'sessions.selectedCount'
  | 'sessions.columnTitle'
  | 'sessions.columnStatus'
  | 'sessions.columnActions'
  | 'sessions.archive'
  | 'sessions.unarchive'
  | 'sessions.delete'
  /** The management panel's list states. */
  | 'sessions.loading'
  | 'sessions.empty'
  | 'sessions.noMatches'
  | 'sessions.loadFailed'
  | 'sessions.retry'
  | 'sessions.unavailable'
  | 'sessions.actionFailed'
  | 'sessions.bulkPartial'
  | 'sessions.bulkStopped'
  | 'sessions.bulkArchivePartial'
  | 'sessions.bulkArchiveFailed'
  /** The panel's delete confirmation. */
  | 'sessions.deleteSelectedTitle'
  | 'sessions.deleteBatchDescription'
  /** The panel's stop-and-archive confirmation. */
  | 'sessions.archiveStopTitle'
  | 'sessions.archiveStopDescription'
  | 'sessions.archiveActivity'
  | 'sessions.activityTurn'
  | 'sessions.activitySubagents'
  | 'sessions.activityJobs'
  | 'sessions.activitySchedules'
  | 'sessions.activityOther'
  | 'sessions.archiveStopAction'
  | 'sessions.archiveStopPending'
  /** The native menu's confirmation and both dialogs' buttons. */
  | 'action.cancel'
  | 'action.close'
  | 'delete.title'
  | 'delete.description'
  | 'delete.pending'
  | 'delete.confirm'
  /** A Host half that has not reloaded the new delete route yet. */
  | 'error.host-stale'

/** Every key the page draws from, including the refusal codes. */
export type MessageKey = UiKey | `error.${FailureCode}`

/**
 * The translate seat the page draws through.
 *
 * A key and its placeholder values, read at call time: the function a locale
 * switch hands out is a new one, which is what re-renders the dialog.
 */
export type Translate = (
  key: MessageKey,
  params?: Readonly<Record<string, string | number>>,
) => string

/** The English copy, which is also the fallback every lookup ends at. */
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
  'sessions.bulkPartial': 'Deleted {deleted} session(s); {failed} could not be deleted.',
  'sessions.bulkStopped': 'Deleted {deleted} session(s); the rest could not be processed.',
  'sessions.bulkArchivePartial': 'Archived {archived} session(s); {skipped} running session(s) were skipped.',
  'sessions.bulkArchiveFailed': 'Archived {archived} session(s); {failed} could not be archived.',

  'sessions.deleteSelectedTitle': 'Delete selected sessions',
  'sessions.deleteBatchDescription': 'This removes the {count} selected sessions and all of their subagent sessions from disk, including their logs. Running sessions will be terminated. This cannot be undone!',

  'sessions.archiveStopTitle': 'Stop and archive this session?',
  'sessions.archiveStopDescription': '“{title}” still has work in progress. Archiving stops it first; the stopped work will not resume on its own.',
  'sessions.archiveActivity': 'Work that will be stopped',
  'sessions.activityTurn': 'The turn in progress',
  'sessions.activitySubagents': '{count} running subagent(s)',
  'sessions.activityJobs': '{count} background job(s)',
  'sessions.activitySchedules': '{count} scheduled reminder(s)',
  'sessions.activityOther': '{count} other item(s) of work ({kind})',
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
  'error.delete-partial': 'Deleted {deleted} session(s), but {remaining} could not be deleted; retry the remaining ones',
} satisfies Record<MessageKey, string>

/** The Chinese copy, key for key the same page. */
export const zh: typeof en = {
  'action.delete': '删除会话',
  'action.cancel': '取消',
  'action.close': '关闭',

  'settings.nav': '会话管理',
  'settings.title': '会话管理',
  'settings.description': '搜索、筛选、归档或删除会话。',

  'sessions.search': '搜索会话标题',
  'sessions.searchPlaceholder': '搜索...',
  'sessions.allWorkspaces': '全部工作区',
  'sessions.noWorkspace': '未关联工作区',
  'sessions.allSessions': '全部会话',
  'sessions.unarchived': '未归档',
  'sessions.archived': '已归档',
  'sessions.running': '运行中',
  'sessions.selectAll': '全选',
  'sessions.selectOne': '选择 {title}',
  'sessions.archiveSelected': '归档已选',
  'sessions.deleteSelected': '删除已选',
  'sessions.selectedCount': '已选择 {count} 个',
  'sessions.columnTitle': '会话标题',
  'sessions.columnStatus': '状态',
  'sessions.columnActions': '操作',
  'sessions.archive': '归档',
  'sessions.unarchive': '取消归档',
  'sessions.delete': '删除',

  'sessions.loading': '正在载入会话…',
  'sessions.empty': '暂无会话',
  'sessions.noMatches': '没有匹配的会话',
  'sessions.loadFailed': '无法读取会话列表',
  'sessions.retry': '重试',
  'sessions.unavailable': '会话服务尚未就绪，无法归档',
  'sessions.actionFailed': '操作失败',
  'sessions.bulkPartial': '已删除 {deleted} 个会话，{failed} 个删除失败。',
  'sessions.bulkStopped': '已删除 {deleted} 个会话，其余未能继续处理。',
  'sessions.bulkArchivePartial': '已归档 {archived} 个会话，{skipped} 个运行中的会话已跳过。',
  'sessions.bulkArchiveFailed': '已归档 {archived} 个会话，{failed} 个归档失败。',

  'sessions.deleteSelectedTitle': '删除选中的会话',
  'sessions.deleteBatchDescription': '从磁盘移除选中的 {count} 个会话及其所有子会话的日志，正在运行的会话将被终止。此操作不可撤销！',

  'sessions.archiveStopTitle': '停止并归档此会话？',
  'sessions.archiveStopDescription': '“{title}”仍有正在进行的工作。归档会先停止这些工作，停止的工作不会自动继续。',
  'sessions.archiveActivity': '将被停止的工作',
  'sessions.activityTurn': '进行中的回合',
  'sessions.activitySubagents': '{count} 个运行中的子智能体',
  'sessions.activityJobs': '{count} 个后台任务',
  'sessions.activitySchedules': '{count} 条定时提醒',
  'sessions.activityOther': '{count} 项其他工作（{kind}）',
  'sessions.archiveStopAction': '停止并归档',
  'sessions.archiveStopPending': '正在停止并归档…',

  'delete.title': '删除会话',
  'delete.description': '从磁盘移除此会话及其所有子会话的日志，正在运行的会话将被终止。此操作不可撤销！',
  'delete.pending': '正在停止并删除…',
  'delete.confirm': '删除',

  'error.host-stale': 'Host 端仍在运行旧版本，请重启 DSH 后重试。',

  'error.missing-session': '未指定会话',
  'error.unknown-session': '该会话已不存在',
  'error.subagent-delete': '子代理会话不能单独删除，请删除其父会话',
  'error.delete-failed': '无法删除该会话',
  'error.delete-unsupported': '当前 Harness 未暴露删除会话所需的磁盘目录信息',
  'error.delete-active': '会话仍在运行（{activity}），无法停止，因此未删除',
  'error.session-live': '会话仍处于活动状态，无法释放',
  'error.delete-partial': '已删除 {deleted} 个会话，但还有 {remaining} 个未能删除；请重试剩余项',
}
