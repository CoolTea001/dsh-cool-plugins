/**
 * Brazilian Portuguese dictionary, checked complete against the `MessageKey`
 * union. Words follow pt-BR usage, like the shell's own `pt` dictionary.
 *
 * Terminology follows the shell's own dictionaries: “sessão”, “espaço de
 * trabalho”, “arquivar / desarquivar”, “subagente”.
 */

import type { MessageKey } from '../locales.js'

export const pt = {
  'action.delete': 'Excluir sessão',
  'action.cancel': 'Cancelar',
  'action.close': 'Fechar',

  'settings.nav': 'Sessões',
  'settings.title': 'Sessões',
  'settings.description': 'Pesquise, filtre, arquive ou exclua sessões.',

  'sessions.search': 'Pesquisar títulos de sessão',
  'sessions.searchPlaceholder': 'Pesquisar...',
  'sessions.allWorkspaces': 'Todos os espaços de trabalho',
  'sessions.noWorkspace': 'Sem espaço de trabalho',
  'sessions.allSessions': 'Todas as sessões',
  'sessions.unarchived': 'Não arquivadas',
  'sessions.archived': 'Arquivadas',
  'sessions.running': 'Em execução',
  'sessions.selectAll': 'Selecionar tudo',
  'sessions.selectOne': 'Selecionar {title}',
  'sessions.archiveSelected': 'Arquivar selecionadas',
  'sessions.deleteSelected': 'Excluir selecionadas',
  'sessions.selectedCount': 'Selecionadas: {count}',
  'sessions.columnTitle': 'Sessão',
  'sessions.columnStatus': 'Status',
  'sessions.columnActions': 'Ações',
  'sessions.archive': 'Arquivar',
  'sessions.unarchive': 'Desarquivar',
  'sessions.delete': 'Excluir',

  'sessions.loading': 'Carregando sessões…',
  'sessions.empty': 'Ainda não há sessões',
  'sessions.noMatches': 'Nenhuma sessão correspondente',
  'sessions.loadFailed': 'Não foi possível carregar a lista de sessões',
  'sessions.retry': 'Tentar novamente',
  'sessions.unavailable': 'Os serviços de sessão não estão prontos, então o arquivamento não está disponível',
  'sessions.actionFailed': 'A ação falhou',
  'sessions.bulkPartial.one': '1 sessão excluída; {failed} não pôde ser excluída.',
  'sessions.bulkPartial.other': '{deleted} sessões excluídas; {failed} não puderam ser excluídas.',
  'sessions.bulkStopped.one': '1 sessão excluída; o restante não pôde ser processado.',
  'sessions.bulkStopped.other': '{deleted} sessões excluídas; o restante não pôde ser processado.',
  'sessions.bulkArchivePartial.one': '1 sessão arquivada; {skipped} ignorada porque ainda havia trabalho em andamento.',
  'sessions.bulkArchivePartial.other': '{archived} sessões arquivadas; {skipped} ignoradas porque ainda havia trabalho em andamento.',
  'sessions.bulkArchiveFailed.one': '1 sessão arquivada; {failed} não pôde ser arquivada.',
  'sessions.bulkArchiveFailed.other': '{archived} sessões arquivadas; {failed} não puderam ser arquivadas.',

  'sessions.deleteSelectedTitle': 'Excluir as sessões selecionadas',
  'sessions.deleteBatchDescription': 'Isso remove do disco as {count} sessões selecionadas e todas as suas sessões de subagente, incluindo seus registros. As sessões em execução serão encerradas. Esta ação não pode ser desfeita!',

  'sessions.archiveStopTitle': 'Parar e arquivar esta sessão?',
  'sessions.archiveStopDescription': '“{title}” ainda tem trabalho em andamento. Arquivar interrompe esse trabalho primeiro; o trabalho interrompido não será retomado sozinho.',
  'sessions.archiveActivity': 'Trabalho que será interrompido',
  'sessions.activityTurn': 'O turno em andamento',
  'sessions.activitySubagents.one': '1 subagente em execução',
  'sessions.activitySubagents.other': '{count} subagentes em execução',
  'sessions.activityJobs.one': '1 tarefa em segundo plano',
  'sessions.activityJobs.other': '{count} tarefas em segundo plano',
  'sessions.activitySchedules.one': '1 lembrete agendado',
  'sessions.activitySchedules.other': '{count} lembretes agendados',
  'sessions.activityOther.one': '1 outro item de trabalho ({kind})',
  'sessions.activityOther.other': '{count} outros itens de trabalho ({kind})',
  'sessions.archiveStopAction': 'Parar e arquivar',
  'sessions.archiveStopPending': 'Parando e arquivando…',

  'delete.title': 'Excluir sessão',
  'delete.description': 'Isso remove do disco esta sessão e todas as suas sessões de subagente, incluindo seus registros. As sessões em execução serão encerradas. Esta ação não pode ser desfeita!',
  'delete.pending': 'Parando e excluindo…',
  'delete.confirm': 'Excluir',

  'error.host-stale': 'A metade Host ainda está executando uma compilação mais antiga; reinicie o DSH e tente novamente.',

  'error.missing-session': 'Nenhuma sessão foi indicada',
  'error.unknown-session': 'Essa sessão não existe mais',
  'error.subagent-delete': 'Uma sessão de subagente não pode ser excluída sozinha; exclua a conversa principal dela',
  'error.delete-failed': 'Não foi possível excluir a sessão',
  'error.delete-unsupported': 'Este Harness não expõe o layout de sessões em disco necessário para excluir',
  'error.delete-active': 'A sessão ainda está em execução ({activity}) e não pôde ser interrompida, então não foi excluída',
  'error.session-live': 'A sessão ainda está ativa e não pôde ser liberada',
  'error.delete-partial': 'Algumas sessões não puderam ser excluídas: {deleted} removidas, {remaining} ainda presentes. Tente novamente as restantes',
  'error.session-running': 'A sessão ainda está em execução e não pôde ser arquivada',
  'error.activityFallback': 'trabalho em andamento',
  'activity.turn': 'o turno em andamento',
  'activity.subagent': 'subagentes em execução',
  'activity.job': 'tarefas em segundo plano',
  'activity.schedule': 'lembretes agendados',
  'activity.separator': ', ',
} satisfies Record<MessageKey, string>
