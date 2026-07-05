// SHADOW FI sound layer — the haunted radio.
//
// Synthesized static bed (looped noise → wandering bandpass) is always on once
// enabled. Stations are Tyler's REAL tracks: streamed via HTMLAudioElement +
// MediaElementAudioSourceNode (never fetch+decode, so ~4h of journal doesn't
// download), seeked to a random offset so you catch a broadcast already in
// progress, and routed through a lo-fi "radio character" chain. Voices are
// capped so the dial never becomes a mob. No autoplay: enable() must be called
// from a user gesture.

const MAX_VOICES = 1 // one track at a time — no overlapping songs
const TUNE_IN = 1.4 // s, gain ramp as a station locks in
const TUNE_OUT = 2.6 // s, gain ramp as it detunes back into static
const STATIC_BASE = 0.14
const VOICE_LEVEL = 0.9

const LS_VOL = 'shadow-fi:volume'
const LS_MUTED = 'shadow-fi:muted'

function strHash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

// Soft-clip curve for the radio grit.
function makeShaperCurve(amount) {
  const n = 1024
  const curve = new Float32Array(n)
  const k = amount
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
  }
  return curve
}

export function createAudio(handlers = {}) {
  let ctx = null
  let master = null
  let staticGain = null
  let staticBp = null
  let staticSrc = null
  let enabled = false
  let volume = readVolume()
  let muted = readMuted()

  const voices = new Map() // slotIndex -> active (playing) voice
  const pending = new Map() // slotIndex -> voice still loading (no slot claimed yet)
  const deadUrls = new Set() // audio that 404s (e.g. journal not yet uploaded)
  let lastNowPlayingId

  // Report the one track currently sounding (or null) so the dial tracks it 1:1.
  function refreshNowPlaying() {
    let active = null
    for (const v of voices.values()) {
      if (!v.fading) {
        active = v
        break
      }
    }
    if (!active) for (const v of voices.values()) active = v
    const id = active && active.fragment ? active.fragment.id : null
    if (id === lastNowPlayingId) return
    lastNowPlayingId = id
    if (handlers.onNowPlaying) handlers.onNowPlaying(active ? active.fragment : null)
  }

  function readVolume() {
    const v = parseFloat(localStorage.getItem(LS_VOL))
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8
  }
  function readMuted() {
    return localStorage.getItem(LS_MUTED) === '1'
  }

  function applyMasterGain(immediate) {
    if (!master) return
    const target = muted ? 0 : volume
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    if (immediate) master.gain.setValueAtTime(target, now)
    else master.gain.linearRampToValueAtTime(target, now + 0.15)
  }

  function duckStatic() {
    if (!staticGain) return
    const target = STATIC_BASE / (1 + 0.85 * voices.size)
    const now = ctx.currentTime
    staticGain.gain.cancelScheduledValues(now)
    staticGain.gain.linearRampToValueAtTime(target, now + 0.4)
  }

  function startStatic() {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.7
    staticSrc = ctx.createBufferSource()
    staticSrc.buffer = buf
    staticSrc.loop = true
    staticBp = ctx.createBiquadFilter()
    staticBp.type = 'bandpass'
    staticBp.frequency.value = 1800
    staticBp.Q.value = 0.6
    staticGain = ctx.createGain()
    staticGain.gain.value = STATIC_BASE
    staticSrc.connect(staticBp)
    staticBp.connect(staticGain)
    staticGain.connect(master)
    staticSrc.start()
    wanderStatic()
  }

  // Slow random walk of the static's centre frequency — the sound of a dial
  // drifting between stations.
  function wanderStatic() {
    if (!staticBp || !ctx) return
    const now = ctx.currentTime
    const target = 900 + Math.random() * 2600
    staticBp.frequency.cancelScheduledValues(now)
    staticBp.frequency.linearRampToValueAtTime(target, now + 4 + Math.random() * 4)
  }

  async function enable() {
    if (enabled) return true
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return false
      ctx = new AC()
      master = ctx.createGain()
      const comp = ctx.createDynamicsCompressor()
      master.connect(comp)
      comp.connect(ctx.destination)
      applyMasterGain(true)
      startStatic()
      await ctx.resume()
      enabled = true
      // Keep drifting the static forever.
      setInterval(wanderStatic, 6000)
      return true
    } catch (err) {
      console.error('[shadow-fi] audio enable failed:', err)
      return false
    }
  }

  function pickTrackUrl(fragment) {
    // field.js already resolved the one track this station plays.
    return fragment.audio || null
  }

  // The tuner interrupts whatever's playing with a quick fade, freeing the
  // single voice immediately for the station it summoned.
  function hardEvict() {
    for (const [idx, v] of voices) {
      const now = ctx.currentTime
      try {
        v.gain.gain.cancelScheduledValues(now)
        v.gain.gain.setValueAtTime(v.gain.gain.value, now)
        v.gain.gain.linearRampToValueAtTime(0.0001, now + 0.3)
      } catch {
        /* context may be closing */
      }
      voices.delete(idx)
      setTimeout(() => disposeVoice(v), 350)
    }
  }

  function buildVoice(url, pan) {
    const el = new Audio()
    el.crossOrigin = 'anonymous'
    el.preload = 'auto'
    el.src = url
    const srcNode = ctx.createMediaElementSource(el)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1500
    bp.Q.value = 0.5 // gentle — the track stays present, just radio-tinted
    const shaper = ctx.createWaveShaper()
    shaper.curve = makeShaperCurve(2.5)
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null
    if (panner) panner.pan.value = Math.max(-1, Math.min(1, pan))
    const gain = ctx.createGain()
    gain.gain.value = 0.0001
    srcNode.connect(bp)
    bp.connect(shaper)
    if (panner) {
      shaper.connect(panner)
      panner.connect(gain)
    } else {
      shaper.connect(gain)
    }
    gain.connect(master)
    return { el, srcNode, gain, panner, url }
  }

  function disposeVoice(v) {
    try {
      v.el.pause()
      v.el.removeAttribute('src')
      v.el.load()
      v.srcNode.disconnect()
      v.gain.disconnect()
    } catch {
      /* already gone */
    }
  }

  // A station only claims one of the (few) voice slots once its audio actually
  // loads — so tracks that 404 (the journal, until it's uploaded) never starve
  // the tracks that do play.
  function tuneIn(slotIndex, fragment, pan = 0, priority = false) {
    if (!enabled || !ctx) return
    if (voices.has(slotIndex) || pending.has(slotIndex)) return
    const url = pickTrackUrl(fragment)
    if (!url || deadUrls.has(url)) return // project (silent) or known-dead audio

    let v
    try {
      v = buildVoice(url, pan)
    } catch (err) {
      console.debug('[shadow-fi] audio build failed:', err)
      return
    }
    v.priority = priority
    v.cancelled = false
    v.fragment = fragment
    pending.set(slotIndex, v)

    v.el.addEventListener(
      'error',
      () => {
        deadUrls.add(url) // no signal on the CDN — don't try this one again
        pending.delete(slotIndex)
        disposeVoice(v)
      },
      { once: true }
    )

    v.el.addEventListener(
      'loadedmetadata',
      () => {
        pending.delete(slotIndex)
        if (v.cancelled) {
          disposeVoice(v)
          return
        }
        // One at a time: an ambient station waits its turn (including while the
        // previous one fades out); only the tuner interrupts.
        if (voices.size >= MAX_VOICES) {
          if (!priority) {
            disposeVoice(v)
            return
          }
          hardEvict()
        }
        const dur = v.el.duration
        if (Number.isFinite(dur) && dur > 8) {
          try {
            v.el.currentTime = Math.random() * (dur * 0.8) // caught mid-broadcast
          } catch {
            /* not seekable yet */
          }
        }
        v.startedAt = ctx.currentTime
        voices.set(slotIndex, v)
        v.el.play().catch(() => {
          voices.delete(slotIndex)
          disposeVoice(v)
          duckStatic()
          refreshNowPlaying()
        })
        const now = ctx.currentTime
        v.gain.gain.cancelScheduledValues(now)
        v.gain.gain.setValueAtTime(0.0001, now)
        v.gain.gain.linearRampToValueAtTime(VOICE_LEVEL, now + TUNE_IN)
        duckStatic()
        refreshNowPlaying()
      },
      { once: true }
    )
  }

  function tuneOut(slotIndex) {
    const p = pending.get(slotIndex)
    if (p) {
      p.cancelled = true
      pending.delete(slotIndex)
      disposeVoice(p)
      return
    }
    const voice = voices.get(slotIndex)
    if (!voice || voice.fading) return
    // Keep the voice counted while it fades, so the next track doesn't start on
    // top of it — it waits until this one is fully gone.
    voice.fading = true
    const now = ctx.currentTime
    try {
      voice.gain.gain.cancelScheduledValues(now)
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now)
      voice.gain.gain.linearRampToValueAtTime(0.0001, now + TUNE_OUT)
    } catch {
      /* context may be closing */
    }
    setTimeout(() => {
      voices.delete(slotIndex)
      disposeVoice(voice)
      duckStatic()
      refreshNowPlaying()
    }, TUNE_OUT * 1000 + 100)
    duckStatic()
    refreshNowPlaying()
  }

  function setFocusPan(slotIndex, pan) {
    const v = voices.get(slotIndex)
    if (v && v.panner) v.panner.pan.value = Math.max(-1, Math.min(1, pan))
  }

  function suspend() {
    if (!enabled || !ctx) return
    for (const v of voices.values()) {
      try {
        v.el.pause()
      } catch {
        /* ignore */
      }
    }
    ctx.suspend().catch(() => {})
  }

  function resume() {
    if (!enabled || !ctx) return
    ctx.resume().catch(() => {})
    for (const v of voices.values()) {
      if (!v.dead) v.el.play().catch(() => {})
    }
  }

  function toggleMute() {
    muted = !muted
    localStorage.setItem(LS_MUTED, muted ? '1' : '0')
    applyMasterGain(false)
    return muted
  }

  function setVolume(v) {
    volume = Math.min(1, Math.max(0, v))
    localStorage.setItem(LS_VOL, String(volume))
    applyMasterGain(false)
  }

  return {
    enable,
    tuneIn,
    tuneOut,
    setFocusPan,
    suspend,
    resume,
    toggleMute,
    setVolume,
    isEnabled: () => enabled,
    isMuted: () => muted,
    getVolume: () => volume,
  }
}
