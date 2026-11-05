/**
 * The settings dialog, drawn with DSH's own Modal and Button primitives so its
 * chrome, mask, focus trap, Escape handling, and action row match the rest of
 * the product instead of being re-implemented here.
 *
 * It edits one draft of the complete settings document and writes it in one
 * request, so the prompt, the repeat days, and the batch size can never be
 * saved half-applied. The dialog owns its own failure state: a refused write
 * leaves the draft on screen so the user can retry instead of losing the text
 * they just typed.
 */

import * as React from 'react'
import { Button, Modal, SettingsValueField } from '@deepseek-ai/dsh-client-ui-primitives'

import { saveSettings } from './api.js'
import type { Translate } from './locales.js'

/** The props the page hands the dialog. */
export interface SettingsDialogProps {
  /** The plugin's translate seat. */
  t: Translate
  /** The stored settings the draft starts from. */
  settings: { prompt: string; count: number; days: number[] }
  /** Close without saving. */
  onClose: () => void
  /** The stored result, after a successful write. */
  onSaved: (settings: { prompt: string; count: number; days: number[] }) => void
}

/** Display order of the weekday toggles: Monday first, Sunday last. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

/** Clamp one numeric draft to the range the Host accepts. */
function clampCount(value: string): number {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(10, Math.max(1, parsed))
}

/**
 * Keep the count draft inside the accepted 1-10 range while it is typed.
 * An empty draft is allowed through so the field can be cleared and retyped;
 * it settles on the lower bound when the dialog is saved.
 */
function limitCount(value: string): string {
  const digits = value.replace(/\D+/gu, '').replace(/^0+/u, '').slice(0, 2)
  if (digits === '') return ''
  return String(Math.min(10, Number.parseInt(digits, 10)))
}

/**
 * Render the settings dialog.
 * @param props - stored settings, close and save callbacks.
 * @returns the modal dialog.
 */
export function SettingsDialog({
  t,
  settings,
  onClose,
  onSaved,
}: SettingsDialogProps): React.ReactElement {
  const [prompt, setPrompt] = React.useState(settings.prompt)
  const [count, setCount] = React.useState(String(settings.count))
  const [days, setDays] = React.useState<number[]>(settings.days)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const close = (): void => {
    if (!saving) onClose()
  }

  const toggleDay = (day: number): void => {
    setDays(current => current.includes(day)
      ? current.filter(value => value !== day)
      : [...current, day].sort((left, right) => left - right))
  }

  const save = async (): Promise<void> => {
    if (saving) return
    setSaving(true)
    setError(null)
    const next = { prompt: prompt.trim(), count: clampCount(count), days }
    const answer = await saveSettings(next)
    if (answer.ok !== true) {
      setSaving(false)
      setError(`${t('settings.failed')}${answer.error === '' ? '' : `: ${answer.error}`}`)
      return
    }
    onSaved(answer.settings)
  }

  return (
    <Modal
      open
      onClose={close}
      className="dsh-cd-dialog-wide"
      title={t('settings.title')}
      description={t('settings.description')}
      closeLabel={t('settings.close')}
      contentClassName="dsh-cd-dialog-content"
      footer={(
        <>
          <Button variant="outline" data-modal-autofocus disabled={saving} onClick={close}>
            {t('settings.cancel')}
          </Button>
          <Button variant="primary" disabled={saving} onClick={() => { void save() }}>
            {saving ? t('settings.saving') : t('settings.save')}
          </Button>
        </>
      )}
    >
      <label className="dsh-cd-field">
        <span className="dsh-cd-field-label">{t('settings.prompt')}</span>
        <textarea
          className="dsh-cd-textarea"
          value={prompt}
          rows={6}
          onChange={(event) => { setPrompt(event.target.value) }}
          disabled={saving}
        />
        <span className="dsh-cd-hint">{t('settings.promptHint')}</span>
      </label>

      <div className="dsh-cd-field">
        <span className="dsh-cd-field-label">{t('settings.days')}</span>
        <div className="dsh-cd-days">
          {WEEK_ORDER.map(day => (
            <button
              key={day}
              type="button"
              className={days.includes(day) ? 'dsh-cd-day dsh-cd-day-active' : 'dsh-cd-day'}
              aria-pressed={days.includes(day)}
              onClick={() => { toggleDay(day) }}
              disabled={saving}
            >
              {t(`weekday.${day}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="dsh-cd-count">
        <SettingsValueField
          id="dsh-cd-count"
          label={t('settings.count')}
          text={count}
          numeric
          disabled={saving}
          onEdit={(value) => { setCount(limitCount(value)) }}
        />
      </div>

      {error !== null && <p className="dsh-cd-dialog-error" role="alert">{error}</p>}
    </Modal>
  )
}
