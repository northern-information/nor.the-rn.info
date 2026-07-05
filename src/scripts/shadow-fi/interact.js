// Pointer/touch/keyboard interaction, impulse buffer, focus card, idle drift,
// mood parameters, and the plain-panel renderer for SHADOW FI. Adapted from
// ZOOT's interact.js. Additions: onFocus/onBlur callbacks (so the audio layer
// follows the picture), and a focus card that omits the "open" link when a
// station has no page (a journal day with nowhere to return to).

import { MAX_IMPULSES } from './gl.js'
import { KIND_LABEL } from './field.js'

const DWELL_SECONDS = 0.6
const FOCUS_TIMEOUT = 60 // a tuned station keeps playing a good while
const IDLE_AFTER = 30
const TOUCH_RADIUS_CSS = 48
const HOVER_PAD_CSS = 8

const rand = (lo, hi) => lo + Math.random() * (hi - lo)

export function createInteraction({
  canvas,
  slots,
  focusCard,
  getTime,
  metrics,
  onFocus,
  onBlur,
}) {
  const impulses = new Float32Array(MAX_IMPULSES * 4)
  let impulseCursor = 0
  let lastImpulseAt = -1
  let lastPointer = null // { x, y, t } CSS px
  let hoverSlot = -1
  let hoverStart = 0
  let lastInputAt = 0
  let lastUpdate = 0

  const state = {
    impulses,
    focusIndex: -1,
    focusAmount: 0,
    focusTarget: 0,
    thickness: 0.4,
    phase: 0.3,
    drift: [0.6, 0.4],
  }

  const mood = {
    thickness: state.thickness,
    phase: state.phase,
    drift: [...state.drift],
    nextRetarget: 0,
  }

  const idle = { next: 0, x: 0.5, y: 0.5 }

  function addImpulse(uvX, uvY, strength, time) {
    const { aspect } = metrics()
    const base = impulseCursor * 4
    impulses[base] = uvX * aspect
    impulses[base + 1] = uvY
    impulses[base + 2] = time
    impulses[base + 3] = strength
    impulseCursor = (impulseCursor + 1) % MAX_IMPULSES
  }

  function stir(cssX, cssY, strength, time) {
    const { cssW, cssH } = metrics()
    // gl_FragCoord is bottom-up; pointer Y is top-down.
    addImpulse(cssX / cssW, 1 - cssY / cssH, strength, time)
  }

  function toSheet(cssX, cssY) {
    const { cssW, cssH, sheetW, sheetH } = metrics()
    return {
      x: (cssX / cssW) * sheetW,
      y: (cssY / cssH) * sheetH,
      scale: sheetW / cssW,
    }
  }

  // Stereo pan for a slot from its horizontal position (−0.7..0.7).
  function panFor(slotIndex) {
    const { sheetW } = metrics()
    const r = slots.slots[slotIndex] && slots.slots[slotIndex].rect
    if (!r || !sheetW) return 0
    return ((r.x + r.w / 2) / sheetW) * 1.4 - 0.7
  }

  function showCard(fragment, slotIndex) {
    const { cssW, cssH, sheetW, sheetH } = metrics()
    const r = slots.slots[slotIndex].rect
    focusCard.innerHTML = ''
    const kindEl = document.createElement('span')
    kindEl.className = 'sf-focus-kind'
    kindEl.textContent = `${KIND_LABEL[fragment.kind] || 'SIGNAL'}${fragment.date ? ` · ${fragment.date}` : ''}`
    const titleEl = document.createElement('span')
    titleEl.className = 'sf-focus-title'
    titleEl.textContent = fragment.title
    focusCard.append(kindEl, titleEl)
    if (fragment.trackTitle) {
      const trackEl = document.createElement('span')
      trackEl.className = 'sf-focus-track'
      trackEl.textContent = fragment.trackTitle
      focusCard.append(trackEl)
    }
    if (fragment.url) {
      const link = document.createElement('a')
      link.href = fragment.url
      link.textContent = 'OPEN RECORD →'
      focusCard.append(link)
    } else {
      const note = document.createElement('span')
      note.className = 'sf-focus-note'
      note.textContent = 'no signal — nowhere to return'
      focusCard.append(note)
    }
    focusCard.hidden = false
    const cardW = Math.min(focusCard.offsetWidth || 320, cssW - 32)
    const cardH = focusCard.offsetHeight || 120
    let x = (r.x / sheetW) * cssW
    let y = ((r.y + r.h) / sheetH) * cssH + 14
    x = Math.min(Math.max(16, x), cssW - cardW - 16)
    if (y + cardH > cssH - 16) y = (r.y / sheetH) * cssH - cardH - 14
    focusCard.style.left = `${x}px`
    focusCard.style.top = `${Math.max(16, y)}px`
  }

  function focus(index) {
    const fragment = slots.focus(index)
    if (!fragment) return
    state.focusIndex = index
    state.focusTarget = 1
    showCard(fragment, index)
    if (onFocus) onFocus(index, fragment, panFor(index))
  }

  function dismiss(time) {
    if (state.focusIndex < 0) return
    const idx = state.focusIndex
    slots.unfocus(idx, time)
    state.focusTarget = 0
    focusCard.hidden = true
    if (onBlur) onBlur(idx)
  }

  function onPointerMove(event) {
    const time = getTime()
    lastInputAt = time
    const r = canvas.getBoundingClientRect()
    const x = event.clientX - r.left
    const y = event.clientY - r.top
    if (lastPointer && time > lastPointer.t) {
      const speed =
        Math.hypot(x - lastPointer.x, y - lastPointer.y) / (time - lastPointer.t)
      if (time - lastImpulseAt > 0.04 && speed > 40) {
        stir(x, y, Math.min(0.3, speed * 0.00015), time)
        lastImpulseAt = time
      }
    }
    lastPointer = { x, y, t: time }
    if (event.pointerType !== 'touch' && state.focusIndex < 0) {
      const p = toSheet(x, y)
      const hit = slots.hitTest(p.x, p.y, HOVER_PAD_CSS * p.scale)
      if (hit !== hoverSlot) {
        hoverSlot = hit
        hoverStart = time
      }
    }
  }

  function onPointerDown(event) {
    const time = getTime()
    lastInputAt = time
    const r = canvas.getBoundingClientRect()
    const x = event.clientX - r.left
    const y = event.clientY - r.top
    const p = toSheet(x, y)
    const radius =
      event.pointerType === 'touch'
        ? TOUCH_RADIUS_CSS * p.scale
        : HOVER_PAD_CSS * p.scale
    const hit = slots.hitTest(p.x, p.y, radius)
    if (hit >= 0 && hit !== state.focusIndex) {
      dismiss(time)
      focus(hit)
    } else if (hit < 0) {
      dismiss(time)
      stir(x, y, 0.22, time)
    }
  }

  function onKeyDown(event) {
    if (event.key !== 'Escape') return
    // Esc only dismisses a locked station — this is the homepage, nowhere to exit to.
    if (state.focusIndex >= 0) {
      lastInputAt = getTime()
      dismiss(getTime())
    }
  }

  // Listen on the canvas so the header, footer, and tuner don't stir the field.
  canvas.addEventListener('pointermove', onPointerMove, { passive: true })
  canvas.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('keydown', onKeyDown)

  return {
    state,

    // Lock a slot the tuner just summoned.
    tune(index) {
      if (index < 0) return
      dismiss(getTime())
      focus(index)
    },

    update(time) {
      const dt = Math.min(0.1, Math.max(0.001, time - lastUpdate))
      lastUpdate = time

      if (
        hoverSlot >= 0 &&
        state.focusIndex < 0 &&
        time - hoverStart > DWELL_SECONDS
      ) {
        focus(hoverSlot)
        hoverSlot = -1
      }

      state.focusAmount +=
        (state.focusTarget - state.focusAmount) * Math.min(1, dt * 6)
      if (state.focusTarget === 0 && state.focusAmount < 0.02) {
        state.focusIndex = -1
      }
      if (state.focusIndex >= 0 && time - lastInputAt > FOCUS_TIMEOUT) {
        dismiss(time)
      }

      // Idle drift: an autonomous stirrer keeps the dial roaming.
      if (time - lastInputAt > IDLE_AFTER && time > idle.next) {
        idle.x = Math.min(0.9, Math.max(0.1, idle.x + rand(-0.25, 0.25)))
        idle.y = Math.min(0.9, Math.max(0.1, idle.y + rand(-0.25, 0.25)))
        addImpulse(idle.x, idle.y, rand(0.04, 0.1), time)
        idle.next = time + rand(6, 10)
      }

      // Mood random-walk: signal noise, chroma spread, roll shift slowly.
      if (time > mood.nextRetarget) {
        mood.thickness = rand(0.1, 0.8)
        mood.phase = rand(0, 1)
        mood.drift = [rand(-1.2, 1.2), rand(-1.2, 1.2)]
        mood.nextRetarget = time + rand(8, 15)
      }
      const k = Math.min(1, dt * 0.15)
      state.thickness += (mood.thickness - state.thickness) * k
      state.phase += (mood.phase - state.phase) * k
      state.drift[0] += (mood.drift[0] - state.drift[0]) * k
      state.drift[1] += (mood.drift[1] - state.drift[1]) * k
    },
  }
}

// Plain readable panel — used for reduced-motion and failure states.
export function renderPanel(container, heading, fragments) {
  container.innerHTML = ''
  const headingEl = document.createElement('p')
  headingEl.className = 'sf-panel-heading'
  headingEl.textContent = heading
  container.appendChild(headingEl)
  if (fragments && fragments.length) {
    const list = document.createElement('ul')
    list.className = 'sf-panel-list'
    for (const fragment of fragments) {
      const item = document.createElement('li')
      const kind = document.createElement('span')
      kind.className = 'sf-kind'
      kind.textContent = `${KIND_LABEL[fragment.kind] || 'SIGNAL'}${fragment.date ? ` · ${fragment.date}` : ''}`
      const label = fragment.trackTitle
        ? `${fragment.title} — ${fragment.trackTitle}`
        : fragment.title
      if (fragment.url) {
        const link = document.createElement('a')
        link.href = fragment.url
        link.textContent = label
        item.append(kind, link)
      } else {
        const span = document.createElement('span')
        span.textContent = label
        item.append(kind, span)
      }
      list.appendChild(item)
    }
    container.appendChild(list)
  } else {
    const wrapper = document.createElement('p')
    wrapper.className = 'sf-panel-heading'
    const link = document.createElement('a')
    link.href = '/music/'
    link.textContent = 'the music'
    wrapper.append('The records remain: ', link)
    container.appendChild(wrapper)
  }
  container.hidden = false
}
