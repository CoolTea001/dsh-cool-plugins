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

import type { MessageKey } from '../locales.js'

export const ru = {
  'action.delete': 'Удалить сеанс',
  'action.cancel': 'Отмена',
  'action.close': 'Закрыть',

  'settings.nav': 'Сеансы',
  'settings.title': 'Сеансы',
  'settings.description': 'Поиск, фильтрация, архивирование и удаление сеансов.',

  'sessions.search': 'Поиск по названиям сеансов',
  'sessions.searchPlaceholder': 'Поиск...',
  'sessions.allWorkspaces': 'Все рабочие области',
  'sessions.noWorkspace': 'Без рабочей области',
  'sessions.allSessions': 'Все сеансы',
  'sessions.unarchived': 'Неархивированные',
  'sessions.archived': 'Архивированные',
  'sessions.running': 'Выполняется',
  'sessions.selectAll': 'Выбрать все',
  'sessions.selectOne': 'Выбрать {title}',
  'sessions.archiveSelected': 'Архивировать выбранные',
  'sessions.deleteSelected': 'Удалить выбранные',
  'sessions.selectedCount': 'Выбрано: {count}',
  'sessions.columnTitle': 'Сеанс',
  'sessions.columnStatus': 'Состояние',
  'sessions.columnActions': 'Действия',
  'sessions.archive': 'Архивировать',
  'sessions.unarchive': 'Разархивировать',
  'sessions.delete': 'Удалить',

  'sessions.loading': 'Загрузка сеансов…',
  'sessions.empty': 'Сеансов пока нет',
  'sessions.noMatches': 'Подходящих сеансов нет',
  'sessions.loadFailed': 'Не удалось загрузить список сеансов',
  'sessions.retry': 'Повторить',
  'sessions.unavailable': 'Службы сеансов не готовы, поэтому архивирование недоступно',
  'sessions.actionFailed': 'Действие не выполнено',
  'sessions.bulkPartial.one': 'Удалён 1 сеанс; {failed} удалить не удалось.',
  'sessions.bulkPartial.other': 'Удалено сеансов: {deleted}; удалить не удалось: {failed}.',
  'sessions.bulkStopped.one': 'Удалён 1 сеанс; остальные обработать не удалось.',
  'sessions.bulkStopped.other': 'Удалено сеансов: {deleted}; остальные обработать не удалось.',
  'sessions.bulkArchivePartial.one': 'Архивирован 1 сеанс; {skipped} пропущен, так как в нём ещё шла работа.',
  'sessions.bulkArchivePartial.other': 'Архивировано сеансов: {archived}; пропущено из-за незавершённой работы: {skipped}.',
  'sessions.bulkArchiveFailed.one': 'Архивирован 1 сеанс; {failed} архивировать не удалось.',
  'sessions.bulkArchiveFailed.other': 'Архивировано сеансов: {archived}; архивировать не удалось: {failed}.',

  'sessions.deleteSelectedTitle': 'Удалить выбранные сеансы',
  'sessions.deleteBatchDescription': 'Это удалит с диска {count} выбранных сеансов и все их сеансы субагентов вместе с журналами. Выполняющиеся сеансы будут прерваны. Отменить это невозможно!',

  'sessions.archiveStopTitle': 'Остановить и заархивировать этот сеанс?',
  'sessions.archiveStopDescription': 'В «{title}» ещё идёт работа. Архивирование сначала остановит её; остановленная работа не возобновится сама по себе.',
  'sessions.archiveActivity': 'Работа, которая будет остановлена',
  'sessions.activityTurn': 'Текущий ход',
  'sessions.activitySubagents.one': '1 работающий субагент',
  'sessions.activitySubagents.other': 'Работающих субагентов: {count}',
  'sessions.activityJobs.one': '1 фоновое задание',
  'sessions.activityJobs.other': 'Фоновых заданий: {count}',
  'sessions.activitySchedules.one': '1 запланированное напоминание',
  'sessions.activitySchedules.other': 'Запланированных напоминаний: {count}',
  'sessions.activityOther.one': '1 другой элемент работы ({kind})',
  'sessions.activityOther.other': 'Других элементов работы: {count} ({kind})',
  'sessions.archiveStopAction': 'Остановить и заархивировать',
  'sessions.archiveStopPending': 'Остановка и архивирование…',

  'delete.title': 'Удалить сеанс',
  'delete.description': 'Это удалит с диска этот сеанс и все его сеансы субагентов вместе с журналами. Выполняющиеся сеансы будут прерваны. Отменить это невозможно!',
  'delete.pending': 'Остановка и удаление…',
  'delete.confirm': 'Удалить',

  'error.host-stale': 'Host-часть всё ещё работает на старой сборке; перезапустите DSH и повторите попытку.',

  'error.missing-session': 'Сеанс не указан',
  'error.unknown-session': 'Такого сеанса больше нет',
  'error.subagent-delete': 'Сеанс субагента нельзя удалить отдельно; удалите его родительский диалог',
  'error.delete-failed': 'Не удалось удалить сеанс',
  'error.delete-unsupported': 'Этот Harness не предоставляет раскладку сеансов на диске, необходимую для удаления',
  'error.delete-active': 'Сеанс всё ещё выполняется ({activity}) и остановить его не удалось, поэтому он не удалён',
  'error.session-live': 'Сеанс всё ещё активен, и освободить его не удалось',
  'error.delete-partial': 'Часть сеансов удалить не удалось: удалено {deleted}, осталось {remaining}. Повторите попытку для оставшихся',
  'error.session-running': 'Сеанс всё ещё выполняется, и заархивировать его не удалось',
  'error.activityFallback': 'идущая работа',
  'activity.turn': 'текущий ход',
  'activity.subagent': 'работающие субагенты',
  'activity.job': 'фоновые задания',
  'activity.schedule': 'запланированные напоминания',
  'activity.separator': ', ',
} satisfies Record<MessageKey, string>
