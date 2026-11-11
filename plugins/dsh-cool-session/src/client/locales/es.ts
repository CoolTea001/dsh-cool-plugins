/**
 * Spanish dictionary, checked complete against the `MessageKey` union.
 *
 * Terminology follows the shell's own dictionaries: «sesión», «espacio de
 * trabajo», «archivar / desarchivar», «subagente».
 */

import type { MessageKey } from '../locales.js'

export const es = {
  'action.delete': 'Eliminar sesión',
  'action.cancel': 'Cancelar',
  'action.close': 'Cerrar',

  'settings.nav': 'Sesiones',
  'settings.title': 'Sesiones',
  'settings.description': 'Busca, filtra, archiva o elimina sesiones.',

  'sessions.search': 'Buscar títulos de sesión',
  'sessions.searchPlaceholder': 'Buscar...',
  'sessions.allWorkspaces': 'Todos los espacios de trabajo',
  'sessions.noWorkspace': 'Sin espacio de trabajo',
  'sessions.allSessions': 'Todas las sesiones',
  'sessions.unarchived': 'Sin archivar',
  'sessions.archived': 'Archivadas',
  'sessions.running': 'En ejecución',
  'sessions.selectAll': 'Seleccionar todo',
  'sessions.selectOne': 'Seleccionar {title}',
  'sessions.archiveSelected': 'Archivar seleccionadas',
  'sessions.deleteSelected': 'Eliminar seleccionadas',
  'sessions.selectedCount': 'Seleccionadas: {count}',
  'sessions.columnTitle': 'Sesión',
  'sessions.columnStatus': 'Estado',
  'sessions.columnActions': 'Acciones',
  'sessions.archive': 'Archivar',
  'sessions.unarchive': 'Desarchivar',
  'sessions.delete': 'Eliminar',

  'sessions.loading': 'Cargando sesiones…',
  'sessions.empty': 'Aún no hay sesiones',
  'sessions.noMatches': 'No hay sesiones coincidentes',
  'sessions.loadFailed': 'No se pudo cargar la lista de sesiones',
  'sessions.retry': 'Reintentar',
  'sessions.unavailable': 'Los servicios de sesiones no están listos, por lo que no se puede archivar',
  'sessions.actionFailed': 'La acción falló',
  'sessions.bulkPartial.one': 'Se eliminó 1 sesión; {failed} no se pudo eliminar.',
  'sessions.bulkPartial.other': 'Se eliminaron {deleted} sesiones; {failed} no se pudieron eliminar.',
  'sessions.bulkStopped.one': 'Se eliminó 1 sesión; el resto no se pudo procesar.',
  'sessions.bulkStopped.other': 'Se eliminaron {deleted} sesiones; el resto no se pudo procesar.',
  'sessions.bulkArchivePartial.one': 'Se archivó 1 sesión; {skipped} se omitió porque seguía trabajando.',
  'sessions.bulkArchivePartial.other': 'Se archivaron {archived} sesiones; {skipped} se omitieron porque seguían trabajando.',
  'sessions.bulkArchiveFailed.one': 'Se archivó 1 sesión; {failed} no se pudo archivar.',
  'sessions.bulkArchiveFailed.other': 'Se archivaron {archived} sesiones; {failed} no se pudieron archivar.',

  'sessions.deleteSelectedTitle': 'Eliminar las sesiones seleccionadas',
  'sessions.deleteBatchDescription': 'Esto elimina del disco las {count} sesiones seleccionadas y todas sus sesiones de subagente, incluidos sus registros. Las sesiones en ejecución se terminarán. ¡Esta acción no se puede deshacer!',

  'sessions.archiveStopTitle': '¿Detener y archivar esta sesión?',
  'sessions.archiveStopDescription': '«{title}» todavía tiene trabajo en progreso. Al archivarla se detiene primero; el trabajo detenido no se reanudará por sí solo.',
  'sessions.archiveActivity': 'Trabajo que se detendrá',
  'sessions.activityTurn': 'El turno en progreso',
  'sessions.activitySubagents.one': '1 subagente en ejecución',
  'sessions.activitySubagents.other': '{count} subagentes en ejecución',
  'sessions.activityJobs.one': '1 tarea en segundo plano',
  'sessions.activityJobs.other': '{count} tareas en segundo plano',
  'sessions.activitySchedules.one': '1 recordatorio programado',
  'sessions.activitySchedules.other': '{count} recordatorios programados',
  'sessions.activityOther.one': '1 elemento de trabajo más ({kind})',
  'sessions.activityOther.other': '{count} elementos de trabajo más ({kind})',
  'sessions.archiveStopAction': 'Detener y archivar',
  'sessions.archiveStopPending': 'Deteniendo y archivando…',

  'delete.title': 'Eliminar sesión',
  'delete.description': 'Esto elimina del disco esta sesión y todas sus sesiones de subagente, incluidos sus registros. Las sesiones en ejecución se terminarán. ¡Esta acción no se puede deshacer!',
  'delete.pending': 'Deteniendo y eliminando…',
  'delete.confirm': 'Eliminar',

  'error.host-stale': 'La mitad Host sigue ejecutando una compilación anterior; reinicia DSH y vuelve a intentarlo.',

  'error.missing-session': 'No se indicó ninguna sesión',
  'error.unknown-session': 'Esa sesión ya no existe',
  'error.subagent-delete': 'Una sesión de subagente no se puede eliminar por sí sola; elimina su conversación principal',
  'error.delete-failed': 'No se pudo eliminar la sesión',
  'error.delete-unsupported': 'Este Harness no expone la disposición de sesiones en disco necesaria para eliminarlas',
  'error.delete-active': 'La sesión sigue en ejecución ({activity}) y no se pudo detener, por lo que no se eliminó',
  'error.session-live': 'La sesión sigue activa y no se pudo liberar',
  'error.delete-partial': 'No se pudieron eliminar algunas sesiones: {deleted} eliminadas, {remaining} aún presentes. Reintenta las restantes',
  'error.session-running': 'La sesión sigue en ejecución y no se pudo archivar',
  'error.activityFallback': 'trabajo en progreso',
  'activity.turn': 'el turno en progreso',
  'activity.subagent': 'subagentes en ejecución',
  'activity.job': 'tareas en segundo plano',
  'activity.schedule': 'recordatorios programados',
  'activity.separator': ', ',
} satisfies Record<MessageKey, string>
