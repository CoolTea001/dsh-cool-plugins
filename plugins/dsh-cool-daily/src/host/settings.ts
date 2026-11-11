/**
 * The settings document.
 *
 * A missing or unreadable file reads as the defaults rather than failing the
 * page: settings are a preference, and a half-written JSON file must not take
 * the Daily Post page down. Every write is validated and clamped here so the
 * browser cannot hand the model an unbounded prompt or a thousand articles.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { DailyModel, DailySettings } from '../shared/contract.js'
import { settingsPath } from './paths.js'

/** Longest prompt accepted, in characters. */
const PROMPT_MAX = 4000

/** Bounds of {@link DailySettings.count}. */
const COUNT_MIN = 1
const COUNT_MAX = 10

/** What a fresh install generates from, until the user edits the prompt. */
export const DEFAULT_PROMPT =
  '围绕科技、学习与效率，写一篇能带来新视角的短文：有一个具体的观点，并用可靠的例子或方法支撑它。'

/** A fresh install generates one article every day; the user may deselect days. */
export const DEFAULT_SETTINGS: DailySettings = {
  prompt: DEFAULT_PROMPT,
  count: 1,
  days: [0, 1, 2, 3, 4, 5, 6],
  model: null,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Coerce one stored or submitted model route.
 *
 * A route naming no provider or no model is the same answer as no route at all:
 * the plugin then follows DSH's current default instead of pinning a broken one.
 */
function normalizeModel(value: unknown): DailyModel | null {
  if (!isRecord(value)) return null
  const provider = typeof value.provider === 'string' ? value.provider.trim() : ''
  const model = typeof value.model === 'string' ? value.model.trim() : ''
  if (provider === '' || model === '') return null
  const effort = typeof value.reasoningEffort === 'string' ? value.reasoningEffort.trim() : ''
  return {
    provider: provider.slice(0, 120),
    model: model.slice(0, 200),
    ...(effort === '' ? {} : { reasoningEffort: effort.slice(0, 100) }),
  }
}

/** Coerce one stored or submitted settings record into the accepted shape. */
export function normalizeSettings(value: unknown): DailySettings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS, days: [...DEFAULT_SETTINGS.days] }
  const prompt = typeof value.prompt === 'string' ? value.prompt.trim().slice(0, PROMPT_MAX) : ''
  const countNumber = typeof value.count === 'number' ? value.count : Number.NaN
  const count = Number.isFinite(countNumber)
    ? Math.min(COUNT_MAX, Math.max(COUNT_MIN, Math.round(countNumber)))
    : DEFAULT_SETTINGS.count
  const days = Array.isArray(value.days)
    ? [...new Set(value.days.filter((day): day is number =>
      typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6))].sort((left, right) => left - right)
    : []
  return {
    prompt: prompt === '' ? DEFAULT_SETTINGS.prompt : prompt,
    count,
    days,
    model: normalizeModel(value.model),
  }
}

/** Read the stored settings, falling back to the defaults. */
export async function readSettings(): Promise<DailySettings> {
  try {
    const text = await readFile(settingsPath(), 'utf8')
    return normalizeSettings(JSON.parse(text))
  } catch {
    return { ...DEFAULT_SETTINGS, days: [...DEFAULT_SETTINGS.days] }
  }
}

/**
 * Validate and persist one settings record, then return what was stored.
 *
 * The write goes through a sibling temporary file and a rename so a crash
 * midway leaves the previous document intact instead of a truncated one.
 */
export async function writeSettings(value: unknown): Promise<DailySettings> {
  const settings = normalizeSettings(value)
  const file = settingsPath()
  await mkdir(dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
  await rename(temporary, file)
  return settings
}
