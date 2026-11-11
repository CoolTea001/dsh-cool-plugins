/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the page draws in its own error state, so the page has
 * exactly one failure shape no matter how the answer went wrong.
 */

import {
  API_PATHS,
  type ArticlePayload,
  type DailySettings,
  type DailyStatePayload,
  type ModelEffortsPayload,
  type ModelsPayload,
  type ReadPayload,
  type SettingsPayload,
} from '../shared/contract.js'

/** Any answer: the success payload, or the one failure shape above. */
type Answer<T> = T | { ok: false; error: string }

/** POST or PUT one JSON body and read a JSON answer. */
async function sendJson<T>(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<Answer<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    })
    const payload: unknown = await response.json().catch(() => null)
    if (payload === null || typeof payload !== 'object') {
      return { ok: false, error: `HTTP ${response.status}` }
    }
    return payload as Answer<T>
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Read one JSON answer from a GET route. */
async function getJson<T>(url: string): Promise<Answer<T>> {
  try {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
    const payload: unknown = await response.json().catch(() => null)
    if (payload === null || typeof payload !== 'object') {
      return { ok: false, error: `HTTP ${response.status}` }
    }
    return payload as Answer<T>
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Read settings, articles, and the current generation state. */
export function fetchState(): Promise<Answer<DailyStatePayload>> {
  return getJson<DailyStatePayload>(API_PATHS.state)
}

/** Persist the complete settings record. */
export function saveSettings(settings: DailySettings): Promise<Answer<SettingsPayload>> {
  return sendJson<SettingsPayload>(API_PATHS.settings, 'PUT', { settings })
}

/** Ask the Host to start one manual batch. */
export function startGeneration(): Promise<Answer<{ ok: true; started: true }>> {
  return sendJson<{ ok: true; started: true }>(API_PATHS.generate, 'POST')
}

/** Ask the Host to delete one article file. */
export function deleteArticle(id: string): Promise<Answer<{ ok: true }>> {
  return sendJson<{ ok: true }>(`${API_PATHS.article}?id=${encodeURIComponent(id)}`, 'DELETE')
}

/** Read one article body by id. */
export function fetchArticle(id: string): Promise<Answer<ArticlePayload>> {
  return getJson<ArticlePayload>(`${API_PATHS.article}?id=${encodeURIComponent(id)}`)
}

/** Read the model catalog the settings picker offers. */
export function fetchModels(): Promise<Answer<ModelsPayload>> {
  return getJson<ModelsPayload>(API_PATHS.models)
}

/** Read the reasoning levels one route offers. */
export function fetchModelEfforts(provider: string, model: string): Promise<Answer<ModelEffortsPayload>> {
  const query = `provider=${encodeURIComponent(provider)}&model=${encodeURIComponent(model)}`
  return getJson<ModelEffortsPayload>(`${API_PATHS.efforts}?${query}`)
}

/** Record that the reader opened one article. */
export function markRead(id: string): Promise<Answer<ReadPayload>> {
  return sendJson<ReadPayload>(API_PATHS.read, 'PUT', { id })
}
