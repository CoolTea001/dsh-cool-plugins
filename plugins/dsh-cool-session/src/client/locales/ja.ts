/**
 * Japanese dictionary, checked complete against the `MessageKey` union.
 *
 * Japanese does not inflect for number, so the `.one` / `.other` pairs spell
 * the same sentence twice; the pair still exists because the caller picks the
 * key from the count (see `countKey`), and a missing spelling is a compile
 * error like any other key.
 */

import type { MessageKey } from '../locales.js'

export const ja = {
  'action.delete': 'セッションを削除',
  'action.cancel': 'キャンセル',
  'action.close': '閉じる',

  'settings.nav': 'セッション',
  'settings.title': 'セッション',
  'settings.description': 'セッションの検索・絞り込み・アーカイブ・削除を行います。',

  'sessions.search': 'セッション名を検索',
  'sessions.searchPlaceholder': '検索...',
  'sessions.allWorkspaces': 'すべてのワークスペース',
  'sessions.noWorkspace': 'ワークスペースなし',
  'sessions.allSessions': 'すべてのセッション',
  'sessions.unarchived': '未アーカイブ',
  'sessions.archived': 'アーカイブ済み',
  'sessions.running': '実行中',
  'sessions.selectAll': 'すべて選択',
  'sessions.selectOne': '{title} を選択',
  'sessions.archiveSelected': '選択項目をアーカイブ',
  'sessions.deleteSelected': '選択項目を削除',
  'sessions.selectedCount': '{count} 件選択中',
  'sessions.columnTitle': 'セッション名',
  'sessions.columnStatus': '状態',
  'sessions.columnActions': '操作',
  'sessions.archive': 'アーカイブ',
  'sessions.unarchive': 'アーカイブを解除',
  'sessions.delete': '削除',

  'sessions.loading': 'セッションを読み込み中…',
  'sessions.empty': 'セッションはまだありません',
  'sessions.noMatches': '一致するセッションはありません',
  'sessions.loadFailed': 'セッション一覧を読み込めませんでした',
  'sessions.retry': '再試行',
  'sessions.unavailable': 'セッションサービスが準備できていないため、アーカイブできません',
  'sessions.actionFailed': '操作に失敗しました',
  'sessions.bulkPartial.one': 'セッションを 1 件削除しました。{failed} 件は削除できませんでした。',
  'sessions.bulkPartial.other': 'セッションを {deleted} 件削除しました。{failed} 件は削除できませんでした。',
  'sessions.bulkStopped.one': 'セッションを 1 件削除しました。残りは処理できませんでした。',
  'sessions.bulkStopped.other': 'セッションを {deleted} 件削除しました。残りは処理できませんでした。',
  'sessions.bulkArchivePartial.one': 'セッションを 1 件アーカイブしました。{skipped} 件は作業中のためスキップしました。',
  'sessions.bulkArchivePartial.other': 'セッションを {archived} 件アーカイブしました。{skipped} 件は作業中のためスキップしました。',
  'sessions.bulkArchiveFailed.one': 'セッションを 1 件アーカイブしました。{failed} 件はアーカイブできませんでした。',
  'sessions.bulkArchiveFailed.other': 'セッションを {archived} 件アーカイブしました。{failed} 件はアーカイブできませんでした。',

  'sessions.deleteSelectedTitle': '選択したセッションを削除',
  'sessions.deleteBatchDescription': '選択した {count} 件のセッションとそのすべてのサブエージェントセッションを、ログを含めてディスクから削除します。実行中のセッションは終了されます。この操作は元に戻せません！',

  'sessions.archiveStopTitle': 'このセッションを停止してアーカイブしますか？',
  'sessions.archiveStopDescription': '「{title}」には進行中の作業があります。アーカイブするとまず停止され、停止された作業は自動的に再開されません。',
  'sessions.archiveActivity': '停止される作業',
  'sessions.activityTurn': '進行中のターン',
  'sessions.activitySubagents.one': '実行中のサブエージェント 1 件',
  'sessions.activitySubagents.other': '実行中のサブエージェント {count} 件',
  'sessions.activityJobs.one': 'バックグラウンドジョブ 1 件',
  'sessions.activityJobs.other': 'バックグラウンドジョブ {count} 件',
  'sessions.activitySchedules.one': 'スケジュールされたリマインダー 1 件',
  'sessions.activitySchedules.other': 'スケジュールされたリマインダー {count} 件',
  'sessions.activityOther.one': 'その他の作業 1 件（{kind}）',
  'sessions.activityOther.other': 'その他の作業 {count} 件（{kind}）',
  'sessions.archiveStopAction': '停止してアーカイブ',
  'sessions.archiveStopPending': '停止してアーカイブ中…',

  'delete.title': 'セッションを削除',
  'delete.description': 'このセッションとそのすべてのサブエージェントセッションを、ログを含めてディスクから削除します。実行中のセッションは終了されます。この操作は元に戻せません！',
  'delete.pending': '停止して削除中…',
  'delete.confirm': '削除',

  'error.host-stale': 'Host 側が古いビルドのままです。DSH を再起動してから再試行してください。',

  'error.missing-session': 'セッションが指定されていません',
  'error.unknown-session': 'そのセッションは既に存在しません',
  'error.subagent-delete': 'サブエージェントのセッションは単独では削除できません。親の会話を削除してください',
  'error.delete-failed': 'セッションを削除できませんでした',
  'error.delete-unsupported': 'この Harness は削除に必要なディスク上のセッション配置を公開していません',
  'error.delete-active': 'セッションはまだ実行中（{activity}）で停止できなかったため、削除しませんでした',
  'error.session-live': 'セッションがまだ活動中で、解放できませんでした',
  'error.delete-partial': '一部のセッションを削除できませんでした：{deleted} 件を削除、{remaining} 件が残っています。残りを再試行してください',
  'error.session-running': 'セッションはまだ実行中で、アーカイブできませんでした',
  'error.activityFallback': '進行中の作業',
  'activity.turn': '進行中のターン',
  'activity.subagent': '実行中のサブエージェント',
  'activity.job': 'バックグラウンドジョブ',
  'activity.schedule': 'スケジュールされたリマインダー',
  'activity.separator': '、',
} satisfies Record<MessageKey, string>
