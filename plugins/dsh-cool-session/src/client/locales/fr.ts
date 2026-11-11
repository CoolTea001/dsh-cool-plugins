/**
 * French dictionary, checked complete against the `MessageKey` union.
 *
 * Terminology follows the shell's own dictionaries: « séance » for a session,
 * « espace de travail », « archiver / désarchiver », « sous-agent ». French
 * uses the non-breaking space before `?` and `!` that the shell's French
 * strings also carry.
 */

import type { MessageKey } from '../locales.js'

export const fr = {
  'action.delete': 'Supprimer la séance',
  'action.cancel': 'Annuler',
  'action.close': 'Fermer',

  'settings.nav': 'Séances',
  'settings.title': 'Séances',
  'settings.description': 'Recherchez, filtrez, archivez ou supprimez des séances.',

  'sessions.search': 'Rechercher les titres de séance',
  'sessions.searchPlaceholder': 'Rechercher...',
  'sessions.allWorkspaces': 'Tous les espaces de travail',
  'sessions.noWorkspace': 'Aucun espace de travail',
  'sessions.allSessions': 'Toutes les séances',
  'sessions.unarchived': 'Non archivées',
  'sessions.archived': 'Archivées',
  'sessions.running': 'En cours',
  'sessions.selectAll': 'Tout sélectionner',
  'sessions.selectOne': 'Sélectionner {title}',
  'sessions.archiveSelected': 'Archiver la sélection',
  'sessions.deleteSelected': 'Supprimer la sélection',
  'sessions.selectedCount': 'Sélection : {count}',
  'sessions.columnTitle': 'Séance',
  'sessions.columnStatus': 'État',
  'sessions.columnActions': 'Actions',
  'sessions.archive': 'Archiver',
  'sessions.unarchive': 'Désarchiver',
  'sessions.delete': 'Supprimer',

  'sessions.loading': 'Chargement des séances…',
  'sessions.empty': 'Aucune séance pour l’instant',
  'sessions.noMatches': 'Aucune séance correspondante',
  'sessions.loadFailed': 'Impossible de charger la liste des séances',
  'sessions.retry': 'Réessayer',
  'sessions.unavailable': 'Les services de séance ne sont pas prêts, l’archivage est donc indisponible',
  'sessions.actionFailed': 'L’action a échoué',
  'sessions.bulkPartial.one': '1 séance supprimée ; {failed} n’a pas pu l’être.',
  'sessions.bulkPartial.other': '{deleted} séances supprimées ; {failed} n’ont pas pu l’être.',
  'sessions.bulkStopped.one': '1 séance supprimée ; le reste n’a pas pu être traité.',
  'sessions.bulkStopped.other': '{deleted} séances supprimées ; le reste n’a pas pu être traité.',
  'sessions.bulkArchivePartial.one': '1 séance archivée ; {skipped} ignorée car elle travaillait encore.',
  'sessions.bulkArchivePartial.other': '{archived} séances archivées ; {skipped} ignorées car elles travaillaient encore.',
  'sessions.bulkArchiveFailed.one': '1 séance archivée ; {failed} n’a pas pu l’être.',
  'sessions.bulkArchiveFailed.other': '{archived} séances archivées ; {failed} n’ont pas pu l’être.',

  'sessions.deleteSelectedTitle': 'Supprimer les séances sélectionnées',
  'sessions.deleteBatchDescription': 'Cela supprime du disque les {count} séances sélectionnées et toutes leurs séances de sous-agent, journaux compris. Les séances en cours seront interrompues. Cette action est irréversible !',

  'sessions.archiveStopTitle': 'Arrêter et archiver cette séance ?',
  'sessions.archiveStopDescription': '« {title} » a encore du travail en cours. L’archivage l’arrête d’abord ; le travail arrêté ne reprendra pas de lui-même.',
  'sessions.archiveActivity': 'Travail qui sera arrêté',
  'sessions.activityTurn': 'Le tour en cours',
  'sessions.activitySubagents.one': '1 sous-agent en cours d’exécution',
  'sessions.activitySubagents.other': '{count} sous-agents en cours d’exécution',
  'sessions.activityJobs.one': '1 tâche en arrière-plan',
  'sessions.activityJobs.other': '{count} tâches en arrière-plan',
  'sessions.activitySchedules.one': '1 rappel programmé',
  'sessions.activitySchedules.other': '{count} rappels programmés',
  'sessions.activityOther.one': '1 autre élément de travail ({kind})',
  'sessions.activityOther.other': '{count} autres éléments de travail ({kind})',
  'sessions.archiveStopAction': 'Arrêter et archiver',
  'sessions.archiveStopPending': 'Arrêt et archivage…',

  'delete.title': 'Supprimer la séance',
  'delete.description': 'Cela supprime du disque cette séance et toutes ses séances de sous-agent, journaux compris. Les séances en cours seront interrompues. Cette action est irréversible !',
  'delete.pending': 'Arrêt et suppression…',
  'delete.confirm': 'Supprimer',

  'error.host-stale': 'La moitié Host exécute encore une compilation plus ancienne ; redémarrez DSH et réessayez.',

  'error.missing-session': 'Aucune séance n’a été indiquée',
  'error.unknown-session': 'Cette séance n’existe plus',
  'error.subagent-delete': 'Une séance de sous-agent ne peut pas être supprimée seule ; supprimez sa conversation parente',
  'error.delete-failed': 'La séance n’a pas pu être supprimée',
  'error.delete-unsupported': 'Ce Harness n’expose pas la disposition des séances sur disque nécessaire à la suppression',
  'error.delete-active': 'La séance est encore en cours ({activity}) et n’a pas pu être arrêtée ; elle n’a donc pas été supprimée',
  'error.session-live': 'La séance est encore active et n’a pas pu être libérée',
  'error.delete-partial': 'Certaines séances n’ont pas pu être supprimées : {deleted} supprimées, {remaining} encore présentes. Réessayez les restantes',
  'error.session-running': 'La séance est encore en cours et n’a pas pu être archivée',
  'error.activityFallback': 'travail en cours',
  'activity.turn': 'le tour en cours',
  'activity.subagent': 'sous-agents en cours d’exécution',
  'activity.job': 'tâches en arrière-plan',
  'activity.schedule': 'rappels programmés',
  'activity.separator': ', ',
} satisfies Record<MessageKey, string>
