/**
 * The image pane: one workspace picture drawn as a picture.
 *
 * A file the kind table calls an image is not read for the preview at all. What
 * the page needs is a decoded picture, and the browser already owns a decoder, so
 * the pane hands an `<img>` the raw route's address (`raw.ts`) and lets it fetch,
 * decode and lay the picture out. That is why this module holds almost no state:
 * the interesting work happens in the browser's image pipeline, and what is left
 * for the page is what an `<img>` cannot say — whether it is still loading, and
 * whether it failed.
 *
 * The stage scrolls rather than covering: a tall screenshot or a wide diagram is
 * shown at its own proportions and may be panned, instead of being cropped to
 * fill a frame the picture did not ask for. Clicking the picture opens the
 * shell's own lightbox at the same address, which is what makes a small
 * thumbnail legible without a zoom control of this page's invention.
 *
 * The pane is mounted once per file — the page keys its body by the selected path
 * and the mode — so the load state below belongs to exactly one picture.
 *
 * A failure has two shapes and they are not interchangeable. A picture the pane
 * already knows is over the cap cannot be rescued by asking again, so it is
 * reported as a size problem with no retry; anything else (a file that moved, a
 * decode that failed, a Host that refused) may well be transient, so it offers
 * one. The Host's own error text cannot help here: an `<img>` never exposes the
 * body of a failed response, which is why the size is checked on this side from
 * the listing's own measurement.
 */

import { useState, type ReactElement } from 'react'
import { ImageLightbox } from '@dsh-cool/ui'
import type { Translate } from './locales.js'

/** Props of the image pane. */
interface ImagePreviewProps {
  /** The raw address of the picture, from the Host's raw route. */
  readonly src: string
  /** The file's basename, used as the picture's accessible description. */
  readonly alt: string
  /**
   * The Host's refusal, when this pane's owner already knows the picture cannot
   * be shown (it is over the raw route's cap). Undefined means "ask for it".
   */
  readonly refusal?: string | undefined
  /** The page's translate seat. */
  readonly t: Translate
}

/**
 * Draw one workspace image, and open it enlarged when clicked.
 *
 * @param props - the picture's address, its name, any known refusal, and the page's copy.
 * @returns the image stage.
 */
export function ImageView({ src, alt, refusal, t }: ImagePreviewProps): ReactElement {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [open, setOpen] = useState(false)
  /**
   * How many times the reader has asked for this picture again.
   *
   * An `<img>` caches by address, so retrying after a failure needs a different
   * address to re-fetch: the raw route ignores the extra parameter, and the
   * browser treats the URL as the new one it is.
   */
  const [attempt, setAttempt] = useState(0)
  const address = attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`

  if (refusal !== undefined) {
    return (
      <div className="dsh-cf-image" data-state="failed">
        <div className="dsh-cf-image-failed" role="alert">
          <span>{refusal}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dsh-cf-image" data-state={state}>
      {state === 'failed' ? (
        <div className="dsh-cf-image-failed" role="alert">
          <span>{t('preview.imageFailed')}</span>
          <button
            type="button"
            className="dsh-cf-link"
            onClick={() => {
              setState('loading')
              setAttempt((count) => count + 1)
            }}
          >
            {t('preview.imageRetry')}
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="dsh-cf-image-open"
            title={t('preview.imageOpen')}
            aria-label={t('preview.imageOpen')}
            onClick={() => setOpen(true)}
          >
            <img
              className="dsh-cf-image-img"
              src={address}
              alt={alt}
              decoding="async"
              onLoad={() => setState('ready')}
              onError={() => setState('failed')}
            />
          </button>
          {state === 'loading' ? (
            <div className="dsh-cf-image-status" role="status">
              {t('preview.imageLoading')}
            </div>
          ) : null}
        </>
      )}
      {open ? (
        <ImageLightbox
          src={address}
          alt={alt}
          // The dialog is named after the file it shows, so a screen reader says
          // which picture opened rather than the name of the action that opened it.
          labels={{ dialog: alt === '' ? t('preview.imageDialog') : alt, close: t('preview.imageClose') }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}
