// The tuner — a fixed analog dial along the bottom. It anchors the drifting
// field with stable chrome, always shows what's tuned, and lets you actively
// scan the band and lock a station (drag or arrow keys) instead of only
// waiting for one to surface.
//
// The "band" is the whole station pool ordered by date, so dragging left→right
// sweeps 2012 → now. onTune(fragment) is called when the dial settles.

import { KIND_LABEL } from './field.js'

const dateKey = (f) => {
  const digits = (f.date || '').replace(/\D/g, '')
  return digits ? parseInt(digits, 10) : 0
}

export function createTuner({ dial, needle, readout, pool, onTune }) {
  const band = pool.slice().sort((a, b) => dateKey(a) - dateKey(b))
  const N = band.length
  if (!N) return { setReadout() {}, setIdle() {} }

  let dragging = false

  const idxAt = (p) => Math.max(0, Math.min(N - 1, Math.round(p * (N - 1))))
  const setNeedle = (p) => {
    needle.style.left = `${(p * 100).toFixed(2)}%`
  }
  const posFromEvent = (e) => {
    const r = dial.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
  }

  function label(fragment, lead) {
    const kind = KIND_LABEL[fragment.kind] || 'SIGNAL'
    return `${lead} ${fragment.title} · ${kind}`
  }

  function scanTo(p) {
    setNeedle(p)
    const fragment = band[idxAt(p)]
    readout.textContent = label(fragment, '▸')
    dial.setAttribute('aria-valuenow', String(Math.round(p * 100)))
    dial.setAttribute('aria-valuetext', `${fragment.title}, ${fragment.kind}`)
    return fragment
  }

  dial.addEventListener('pointerdown', (e) => {
    e.stopPropagation()
    dragging = true
    dial.setPointerCapture(e.pointerId)
    scanTo(posFromEvent(e))
  })
  dial.addEventListener('pointermove', (e) => {
    if (!dragging) return
    e.stopPropagation()
    scanTo(posFromEvent(e))
  })
  const end = (e) => {
    if (!dragging) return
    dragging = false
    if (e.stopPropagation) e.stopPropagation()
    onTune(band[idxAt(posFromEvent(e))])
  }
  dial.addEventListener('pointerup', end)
  dial.addEventListener('pointercancel', () => {
    dragging = false
  })

  // Keyboard: arrows step the dial, Enter/Space tunes.
  let kbIndex = 0
  dial.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      kbIndex = Math.max(
        0,
        Math.min(N - 1, kbIndex + (e.key === 'ArrowRight' ? 1 : -1))
      )
      scanTo(kbIndex / (N - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTune(band[kbIndex])
    }
  })

  return {
    setReadout(fragment) {
      if (!fragment) {
        readout.textContent = '— static —'
        return
      }
      readout.textContent = label(fragment, '◉')
      const i = band.indexOf(fragment)
      if (i >= 0) {
        kbIndex = i
        setNeedle(N > 1 ? i / (N - 1) : 0)
      }
    },
    setIdle() {
      readout.textContent = '— static —'
    },
  }
}
