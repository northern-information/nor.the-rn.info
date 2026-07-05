// SHADOW FI entry point: capability checks, boot, render loop, lifecycle, and
// the wiring between the picture (field/slots) and the sound (audio). Adapted
// from ZOOT's main.js.

import {
  loadFragmentPool,
  createPicker,
  FragmentSlots,
  KIND_TINT,
} from './field.js'
import { createRenderer, MAX_FRAGS } from './gl.js'
import { createInteraction, renderPanel } from './interact.js'
import { createAudio } from './audio.js'
import { createTuner } from './tuner.js'

const FALLBACK_HEADING =
  'SHADOW FI — the signal will not resolve on this instrument. The records remain.'
const STATIC_HEADING =
  'SHADOW FI / STILL FRAME — motion suppressed per instrument settings.'

const canvas = document.getElementById('sf-canvas')
const stage = document.getElementById('sf-stage')
const focusCard = document.getElementById('sf-focus')
const fallbackPanel = document.getElementById('sf-fallback')
const soundBtn = document.getElementById('sf-sound')
const volumeInput = document.getElementById('sf-volume')
const tunerEl = document.getElementById('sf-tuner')
const tunerDial = document.getElementById('sf-dial')
const tunerNeedle = document.getElementById('sf-needle')
const tunerReadout = document.getElementById('sf-readout')

// Pause-corrected clock so uTime never jumps after a backgrounded tab.
let pausedTotal = 0
let pauseStart = null
const getTime = () => (performance.now() - pausedTotal) / 1000

let renderer = null
let slots = null
let interaction = null
let audio = null
let tuner = null
let rafId = 0
let cssW = 0
let cssH = 0
let renderScale = 1
let quality = 'high'
let pool = null

const fragRects = new Float32Array(MAX_FRAGS * 4)
const fragReveals = new Float32Array(MAX_FRAGS)
const fragTints = new Float32Array(MAX_FRAGS * 3)
const grainSeed = Math.random() * 1000

const frameDeltas = []
let lastFrameAt = 0

boot()

async function boot() {
  const poolPromise = loadFragmentPool().catch((err) => {
    console.error('[shadow-fi] data load failed:', err)
    return null
  })
  const fontsPromise = Promise.all([
    document.fonts.load("400 16px 'IBM Plex Mono'"),
    document.fonts.ready,
  ]).catch(() => {})

  renderer = createRenderer(canvas)
  if (!renderer) {
    showFallback(await poolPromise)
    return
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    await staticResolution(poolPromise)
    return
  }

  pool = await poolPromise
  await fontsPromise
  if (!pool) {
    showFallback(null)
    return
  }

  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  slots = new FragmentSlots(createPicker(pool), small ? 4 : MAX_FRAGS)
  // The dial follows whatever is actually playing, 1:1 — ambient scans included.
  audio = createAudio({
    onNowPlaying: (fragment) => {
      if (!tuner) return
      if (fragment) tuner.setReadout(fragment)
      else tuner.setIdle()
    },
  })
  interaction = createInteraction({
    canvas,
    slots,
    focusCard,
    getTime,
    metrics: () => ({
      cssW,
      cssH,
      aspect: cssW / cssH,
      sheetW: slots.canvas.width,
      sheetH: slots.canvas.height,
    }),
    onFocus: (index, fragment, pan) => audio.tuneIn(index, fragment, pan, true),
    onBlur: (index) => audio.tuneOut(index),
    onTuneTrack: (fragment) => {
      const i = slots.tuneTo(fragment, getTime())
      if (i >= 0) interaction.tune(i)
    },
  })

  if (tunerDial) {
    tuner = createTuner({
      dial: tunerDial,
      needle: tunerNeedle,
      readout: tunerReadout,
      pool,
      onTune: (fragment) => {
        const i = slots.tuneTo(fragment, getTime())
        if (i >= 0) interaction.tune(i)
      },
    })
  }

  setupSoundControl()
  resizeAll()
  wireLifecycle()
  lastFrameAt = getTime()
  rafId = requestAnimationFrame(frame)
}

function panForSlot(i) {
  const r = slots.slots[i] && slots.slots[i].rect
  const W = slots.canvas.width
  if (!r || !W) return 0
  return ((r.x + r.w / 2) / W) * 1.4 - 0.7
}

function frame() {
  rafId = requestAnimationFrame(frame)
  const time = getTime()

  const { tunedIn, tunedOut } = slots.update(time)
  if (slots.dirty) {
    renderer.uploadTextSheet(slots.canvas)
    slots.dirty = false
  }

  // A station reaching legibility bleeds its audio in; leaving it, out.
  for (const i of tunedIn) {
    const slot = slots.slots[i]
    if (slot.fragment) audio.tuneIn(i, slot.fragment, panForSlot(i), false)
  }
  for (const i of tunedOut) audio.tuneOut(i)

  fragReveals.fill(0)
  slots.slots.forEach((slot, i) => {
    if (!slot.rect || !slot.fragment) return
    fragRects.set(slots.rectUV(slot), i * 4)
    fragReveals[i] = slot.reveal
    fragTints.set(KIND_TINT[slot.fragment.kind] || KIND_TINT.project, i * 3)
  })

  interaction.update(time)
  const s = interaction.state
  renderer.draw({
    time,
    impulses: s.impulses,
    fragRects,
    fragReveals,
    fragTints,
    focusIndex: s.focusIndex,
    focusAmount: s.focusAmount,
    thickness: s.thickness,
    phase: s.phase,
    drift: s.drift,
    grainSeed,
  })

  trackPerformance(time)
}

// One-way adaptive degrade: drop to the 3-tap program first, then shrink the
// drawing buffer (floor 0.6×). CSS size never changes.
function trackPerformance(time) {
  frameDeltas.push(time - lastFrameAt)
  lastFrameAt = time
  if (frameDeltas.length < 60) return
  const median = frameDeltas.slice().sort((a, b) => a - b)[30]
  frameDeltas.length = 0
  if (median <= 0.022) return
  if (quality === 'high') {
    quality = 'low'
    renderer.setQuality('low')
  } else if (renderScale > 0.6) {
    renderScale = Math.max(0.6, renderScale * 0.8)
    resizeAll()
  }
}

function resizeAll() {
  // Embedded: the canvas fills its stage, not the viewport.
  cssW = stage.clientWidth
  cssH = stage.clientHeight
  const small = Math.min(cssW, cssH) < 700
  const dprCap = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5)
  renderer.resize(cssW, cssH, dprCap * renderScale)
  slots.resize(canvas.width, canvas.height)
  renderer.uploadTextSheet(slots.canvas)
  slots.dirty = false
}

// The sound control is the required user gesture: first activation enables the
// AudioContext; after that it toggles mute. Volume appears once enabled.
// Enable-only: the button is the required gesture to start audio, then it's
// done. No toggle-off (mute lives in the volume slider if you want silence).
function setupSoundControl() {
  if (!soundBtn) return
  soundBtn.addEventListener('click', async () => {
    if (audio.isEnabled()) return
    const ok = await audio.enable()
    if (!ok) return
    soundBtn.textContent = 'audio on'
    soundBtn.disabled = true
    if (volumeInput) {
      volumeInput.hidden = false
      volumeInput.value = String(audio.getVolume())
    }
  })
  if (volumeInput) {
    volumeInput.addEventListener('input', () => {
      audio.setVolume(parseFloat(volumeInput.value))
    })
  }
}

function wireLifecycle() {
  let resizeTimer = 0
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resizeAll, 150)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId)
      pauseStart = performance.now()
      if (audio) audio.suspend()
    } else if (pauseStart !== null) {
      pausedTotal += performance.now() - pauseStart
      pauseStart = null
      lastFrameAt = getTime()
      frameDeltas.length = 0
      if (audio) audio.resume()
      rafId = requestAnimationFrame(frame)
    }
  })

  let restoreTimer = 0
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    cancelAnimationFrame(rafId)
    restoreTimer = setTimeout(() => showFallback(pool), 5000)
  })
  canvas.addEventListener('webglcontextrestored', () => {
    clearTimeout(restoreTimer)
    renderer = createRenderer(canvas)
    if (!renderer) {
      showFallback(pool)
      return
    }
    renderer.setQuality(quality)
    resizeAll()
    lastFrameAt = getTime()
    rafId = requestAnimationFrame(frame)
  })
}

// prefers-reduced-motion: one frozen frame, then a readable list. No audio.
async function staticResolution(poolPromise) {
  cssW = stage.clientWidth
  cssH = stage.clientHeight
  const dprCap = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.resize(cssW, cssH, dprCap)
  renderer.draw({
    time: 12.5,
    impulses: new Float32Array(64),
    fragRects,
    fragReveals,
    fragTints,
    focusIndex: -1,
    focusAmount: 0,
    thickness: 0.5,
    phase: 0.4,
    drift: [0.6, 0.4],
    grainSeed,
  })
  if (soundBtn) soundBtn.hidden = true
  if (tunerEl) tunerEl.hidden = true
  const staticPool = await poolPromise
  renderPanel(
    fallbackPanel,
    STATIC_HEADING,
    staticPool ? pickPanelFragments(staticPool, 18) : null
  )
}

function showFallback(loadedPool) {
  canvas.style.display = 'none'
  if (soundBtn) soundBtn.hidden = true
  if (tunerEl) tunerEl.hidden = true
  renderPanel(
    fallbackPanel,
    FALLBACK_HEADING,
    loadedPool ? pickPanelFragments(loadedPool, 18) : null
  )
}

// Weighted-random picks, unique per document.
function pickPanelFragments(fromPool, count) {
  const pick = createPicker(fromPool)
  const seen = new Set()
  const out = []
  let guard = 0
  while (out.length < count && guard++ < 300) {
    const fragment = pick()
    if (seen.has(fragment.docId)) continue
    seen.add(fragment.docId)
    out.push(fragment)
  }
  return out
}
