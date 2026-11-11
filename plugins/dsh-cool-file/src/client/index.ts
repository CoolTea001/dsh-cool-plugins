/**
 * Client entry for dsh-cool-file.
 *
 * Contributes exactly one 'conversation.view' entry, which is what turns into
 * a tab in the session's tab bar. The page reads the session's workspace over
 * this package's own same-origin routes (see the Host half), so there are no
 * optional collaborators here. The shell's composer seat is taken out while
 * this tab is mounted, the same way the Terminal and Git tabs do it.
 *
 * The tab's copy enters through the locale service, which owns the active
 * language and re-renders this entry when it changes: the dictionaries are
 * registered here, the slot entry declares the namespace it reads, and the
 * framework hands the rendered View the `t` seat bound to it.
 */

import { en, NS, zh, type Translate } from './locales.js'
import { FilesView } from './files.js'
import { insertFilesStyles } from './styles.js'

export const name = 'dsh-cool-file/client'

/**
 * The locale service is a required collaborator rather than an optional one:
 * the tab is worded entirely from its dictionaries, so a composition without
 * the service could only draw the wrong language.
 */
export const inject = ['slots', 'locale']

/**
 * The slice of DSH's locale service this plugin uses.
 *
 * The two methods are the ones documented for plugin authors: register the
 * dictionaries, then bind the namespace to a translate function. The bound
 * function reads the active language at call time, which is what lets the tab's
 * own label follow a switch that happened after this plugin was applied.
 */
interface LocaleService {
  /** Register one namespace's dictionaries for the shipped locales. */
  register(ns: string, dicts: Readonly<Record<'zh' | 'en', Readonly<Record<string, string>>>>): () => void
  /** Bind a namespace to a stable translate function reading the active locale. */
  bind(ns: string): Translate
}

export function apply(ctx: any): void {
  const slots = ctx.get('slots')
  if (slots === undefined) return
  const locale: LocaleService = ctx.get('locale')

  ctx.effect(() => insertFilesStyles(), 'dsh-cool-file: styles')
  // The registration's lifetime is the plugin's, so a reload or an HMR update
  // replaces the dictionaries rather than leaving two of them behind.
  ctx.effect(() => locale.register(NS, { zh, en }), 'dsh-cool-file: dictionaries')
  const t = locale.bind(NS)

  // `conversation.view` is a list slot, and a list slot sorts by `order` first
  // (chat 0, trajectory 10, terminal 11, git 12), so `order: 13` puts Files
  // last in the tab bar, after the shipped entries and the Git plugin.
  //
  // Do NOT pass `priority`: a dynamic plugin cannot win a priority contest
  // against the shipped entries, which would hide this tab entirely.
  //
  // Contributing through `slots.inject` ties the registration's lifetime to the
  // owner's declaration, so unloading this plugin (reload or HMR) removes the
  // tab with it. `locale` names the dictionary the entry reads: the framework
  // then passes a `t` seat bound to it and re-renders the tab on a language
  // switch, which is why the label is a thunk read at draw time.
  slots.inject('conversation.view', () =>
    slots.register({
      name: 'conversation.view',
      id: 'files',
      order: 13,
      locale: NS,
      label: () => t('view.files'),
    }, FilesView),
  )
}
