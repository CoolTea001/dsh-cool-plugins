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

/** The copy of the menu row, the Settings section, the confirmation, and its refusals. */
type UiKey =
  /** The native Session menu's row. */
  | 'action.delete'
  /** The Settings navigation entry and the page behind it. */
  | 'settings.nav'
  | 'settings.title'
  | 'settings.empty'
  /** The confirmation's dialog and buttons. */
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
  'settings.empty': 'Session management will appear here in a later release.',

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
  'settings.empty': '会话管理功能将在后续版本中开放。',

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
