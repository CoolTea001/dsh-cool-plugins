/**
 * The model directory the settings picker reads.
 *
 * Two answers live here because the page needs both: which route writes an
 * article when this plugin has pinned none, and which routes it may offer. Both
 * are read from DSH's own services on every request instead of being copied into
 * the settings file, so a model added, removed, or made current elsewhere in the
 * app shows up the next time the dialog opens.
 *
 * `agentDefaultModel` is the deployment's current default selection — the same
 * choice DSH's own model picker saves, and the one this plugin follows until the
 * reader pins a route of their own.
 */

import type { DailyModel, ModelEffortsPayload, ModelGroup } from '../shared/contract.js'

/** The slice of the default-model service this module reads. */
interface DefaultModelService {
  currentSelection(): { provider?: unknown; model?: unknown; reasoningEffort?: unknown }
}

/** The slice of the LLM service this module reads. */
interface LlmService {
  listProviders?(): readonly { id?: unknown; name?: unknown }[]
  listModels?(provider: string): Promise<readonly { id?: unknown; name?: unknown }[]>
  resolveModelInfo?(provider: string, model: string): Promise<{
    reasoning?: { efforts?: readonly { id?: unknown }[] }
  } | null>
}

/**
 * Read DSH's current default selection.
 *
 * @param ctx - the Host plugin context.
 * @returns the route, or null when there is no usable default.
 */
export function defaultSelection(ctx: any): DailyModel | null {
  const service = ctx.get('agentDefaultModel') as DefaultModelService | undefined
  if (service === undefined || typeof service.currentSelection !== 'function') return null
  try {
    const selection = service.currentSelection()
    const provider = selection?.provider
    const model = selection?.model
    if (typeof provider !== 'string' || provider === '') return null
    if (typeof model !== 'string' || model === '') return null
    const effort = selection?.reasoningEffort
    return {
      provider,
      model,
      ...(typeof effort === 'string' && effort !== '' ? { reasoningEffort: effort } : {}),
    }
  } catch {
    // An unreadable selection is no selection, which the page words as "default".
    return null
  }
}

/**
 * Read every registered provider's catalog for the picker.
 *
 * One provider at a time: a provider whose endpoint is unreachable, whose
 * credential is missing, or whose adapter answers with an unusable list is left
 * out rather than taking every other provider's rows with it.
 *
 * @param ctx - the Host plugin context.
 * @returns provider groups in registration order, each in catalog order.
 */
export async function readModelGroups(ctx: any): Promise<ModelGroup[]> {
  const llm = ctx.get('llm') as LlmService | undefined
  if (llm === undefined || typeof llm.listProviders !== 'function' || typeof llm.listModels !== 'function') {
    return []
  }

  let providers: readonly { id?: unknown; name?: unknown }[]
  try {
    const listed = llm.listProviders()
    if (!Array.isArray(listed)) return []
    providers = listed
  } catch {
    return []
  }

  const groups = await Promise.all(providers.map(async (provider): Promise<ModelGroup | undefined> => {
    const id = provider?.id
    if (typeof id !== 'string' || id === '') return undefined
    const name = typeof provider?.name === 'string' && provider.name !== '' ? provider.name : id
    try {
      const models = await llm.listModels?.(id)
      if (!Array.isArray(models)) return undefined
      const options = models
        .filter(model => typeof model?.id === 'string' && model.id !== '' && typeof model?.name === 'string' && model.name !== '')
        .map(model => ({ id: model.id as string, name: model.name as string }))
      return options.length === 0 ? undefined : { provider: id, name, models: options }
    } catch {
      return undefined
    }
  }))

  return groups.filter((group): group is ModelGroup => group !== undefined)
}

/**
 * Read the reasoning levels one exact route offers.
 *
 * Effort metadata is adapter-owned and resolved per model, which is why the
 * picker asks when a row's control is opened rather than shipping every model's
 * list with the catalog. A failed read is reported instead of flattened into an
 * empty list: a row that could not be asked must not look like a model with
 * nothing to choose.
 *
 * @param ctx - the Host plugin context.
 * @param provider - the registered provider route.
 * @param model - the provider-owned model id.
 * @returns the effort ids, or the failure to report.
 */
export async function readModelEfforts(
  ctx: any,
  provider: string,
  model: string,
): Promise<ModelEffortsPayload> {
  const llm = ctx.get('llm') as LlmService | undefined
  if (llm === undefined || typeof llm.resolveModelInfo !== 'function') {
    return { ok: false, error: 'model service unavailable' }
  }
  try {
    const info = await llm.resolveModelInfo(provider, model)
    const declared = Array.isArray(info?.reasoning?.efforts) ? info.reasoning.efforts : []
    const efforts: string[] = []
    for (const effort of declared) {
      const id = effort?.id
      if (typeof id !== 'string' || id === '' || efforts.includes(id)) continue
      efforts.push(id)
    }
    return { ok: true, efforts }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
