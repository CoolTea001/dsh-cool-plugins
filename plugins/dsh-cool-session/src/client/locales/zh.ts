/**
 * Simplified Chinese dictionary.
 *
 * The copy this page was written in, and the one every other dictionary is
 * checked against through `MessageKey` (see `locales.ts`): adding a key here
 * without translating it makes the other seven fail to compile, which is the
 * point — a missing translation is a build error, not a key name on screen.
 */

import type { MessageKey } from '../locales.js'

export const zh = {
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
  'sessions.bulkPartial.one': '已删除 1 个会话，{failed} 个删除失败。',
  'sessions.bulkPartial.other': '已删除 {deleted} 个会话，{failed} 个删除失败。',
  'sessions.bulkStopped.one': '已删除 1 个会话，其余未能继续处理。',
  'sessions.bulkStopped.other': '已删除 {deleted} 个会话，其余未能继续处理。',
  'sessions.bulkArchivePartial.one': '已归档 1 个会话，{skipped} 个运行中的会话已跳过。',
  'sessions.bulkArchivePartial.other': '已归档 {archived} 个会话，{skipped} 个运行中的会话已跳过。',
  'sessions.bulkArchiveFailed.one': '已归档 1 个会话，{failed} 个归档失败。',
  'sessions.bulkArchiveFailed.other': '已归档 {archived} 个会话，{failed} 个归档失败。',

  'sessions.deleteSelectedTitle': '删除选中的会话',
  'sessions.deleteBatchDescription': '从磁盘移除选中的 {count} 个会话及其所有子会话的日志，正在运行的会话将被终止。此操作不可撤销！',

  'sessions.archiveStopTitle': '停止并归档此会话？',
  'sessions.archiveStopDescription': '“{title}”仍有正在进行的工作。归档会先停止这些工作，停止的工作不会自动继续。',
  'sessions.archiveActivity': '将被停止的工作',
  'sessions.activityTurn': '进行中的回合',
  'sessions.activitySubagents.one': '1 个运行中的子智能体',
  'sessions.activitySubagents.other': '{count} 个运行中的子智能体',
  'sessions.activityJobs.one': '1 个后台任务',
  'sessions.activityJobs.other': '{count} 个后台任务',
  'sessions.activitySchedules.one': '1 条定时提醒',
  'sessions.activitySchedules.other': '{count} 条定时提醒',
  'sessions.activityOther.one': '1 项其他工作（{kind}）',
  'sessions.activityOther.other': '{count} 项其他工作（{kind}）',
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
  'error.session-running': '会话仍在运行，无法归档',
  'error.activityFallback': '进行中的工作',
  'activity.turn': '进行中的回合',
  'activity.subagent': '运行中的子智能体',
  'activity.job': '后台任务',
  'activity.schedule': '定时提醒',
  'activity.separator': '、',
} satisfies Record<MessageKey, string>
