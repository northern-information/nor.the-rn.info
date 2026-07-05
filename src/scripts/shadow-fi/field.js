// Station pool, weighted selection, text sheet, and slot lifecycle for SHADOW FI.
// Adapted from ZOOT's fragments.js. Data contract: /shadow-fi.json
//   { stations: [{ id, kind, title, date, url, length?, audio?, tracks? }] }
// kind ∈ journal | release | project. journal/release carry playable audio;
// project is silent "dead air". Each station becomes one text fragment (its
// title); there are no summary sentences here — a station is just its name.

const KIND_WEIGHT = {
  journal: 6, // the unreleased primary corpus — most of the band
  release: 2,
  project: 1,
}

// Tints mirror src/shadow-fi-data.11ty.js (ember / link-yellow / active-red),
// normalized for GL.
export const KIND_TINT = {
  journal: [0.98, 0.62, 0.24],
  release: [0.99, 0.86, 0.2],
  project: [0.94, 0.27, 0.27],
}

export const KIND_LABEL = {
  journal: 'JOURNAL',
  release: 'RELEASE',
  project: 'PROJECT',
}

export async function loadFragmentPool() {
  const res = await fetch('/shadow-fi.json')
  if (!res.ok) throw new Error(`station index fetch failed: ${res.status}`)
  const index = await res.json()
  const pool = []
  for (const s of index.stations || []) {
    if (!s || !s.title || !s.kind) continue
    const kind = KIND_WEIGHT[s.kind] ? s.kind : 'project'
    pool.push({
      kind,
      weight: KIND_WEIGHT[kind],
      id: s.id || `${kind}:${s.title}`,
      docId: s.id || `${kind}:${s.title}`,
      title: s.title,
      date: s.date || '',
      url: s.url || '',
      text: s.title,
      // audio payload (undefined for silent kinds)
      audio: s.audio || null,
      tracks: Array.isArray(s.tracks) ? s.tracks : null,
      length: s.length || '',
    })
  }
  if (!pool.length) throw new Error('station index contained no stations')
  return pool
}

// Weighted-random picker with a recency ring buffer so a session drifts across
// the whole band instead of orbiting the largest kind.
export function createPicker(pool, recentMax = 32) {
  const recent = []
  return function pick() {
    const eligible = pool.filter((f) => !recent.includes(f.id))
    const source = eligible.length ? eligible : pool
    let total = 0
    for (const f of source) total += f.weight
    let r = Math.random() * total
    let chosen = source[source.length - 1]
    for (const f of source) {
      r -= f.weight
      if (r <= 0) {
        chosen = f
        break
      }
    }
    recent.push(chosen.id)
    if (recent.length > recentMax) recent.shift()
    return chosen
  }
}

const PHASE = {
  EMPTY: 'empty',
  SURFACING: 'surfacing',
  LEGIBLE: 'legible',
  DISSOLVING: 'dissolving',
}

const rand = (lo, hi) => lo + Math.random() * (hi - lo)

// Owns the offscreen 2D canvas the shader samples as uTextTex, plus the slot
// lifecycle. Sheet pixels match the GL drawing buffer; rects are exported in
// texture UV space (Y flipped at upload, so vUV = 1 - (y + h) / H).
export class FragmentSlots {
  constructor(pick, maxSlots) {
    this.pick = pick
    this.maxSlots = maxSlots
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.slots = Array.from({ length: maxSlots }, () => ({
      phase: PHASE.EMPTY,
      phaseStart: 0,
      duration: rand(0.4, 4.5), // staggered first surfacings
      fragment: null,
      rect: null, // sheet px
      reveal: 0,
      focused: false,
    }))
    this.dirty = false
  }

  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    for (const slot of this.slots) {
      if (slot.phase !== PHASE.EMPTY) this.reset(slot, 0, rand(0.2, 1.5))
    }
    this.ctx.clearRect(0, 0, width, height)
    this.dirty = true
  }

  reset(slot, time, gap) {
    if (slot.rect) this.clearRect(slot.rect)
    slot.phase = PHASE.EMPTY
    slot.phaseStart = time
    slot.duration = gap
    slot.fragment = null
    slot.rect = null
    slot.reveal = 0
    slot.focused = false
    this.dirty = true
  }

  clearRect(rect) {
    this.ctx.clearRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4)
  }

  // Advance every slot. Returns { tunedIn, tunedOut } — slot indices that just
  // reached / left LEGIBLE this tick, so the audio layer can follow the picture.
  update(time) {
    const tunedIn = []
    const tunedOut = []
    this.slots.forEach((slot, i) => {
      if (slot.focused) return
      const elapsed = time - slot.phaseStart
      if (slot.phase === PHASE.EMPTY) {
        if (elapsed >= slot.duration) this.surface(slot, time)
        slot.reveal = 0
      } else if (slot.phase === PHASE.SURFACING) {
        slot.reveal = Math.min(1, elapsed / slot.duration)
        if (elapsed >= slot.duration) {
          slot.phase = PHASE.LEGIBLE
          slot.phaseStart = time
          slot.duration = rand(6, 10)
          tunedIn.push(i)
        }
      } else if (slot.phase === PHASE.LEGIBLE) {
        slot.reveal = 1
        if (elapsed >= slot.duration) {
          slot.phase = PHASE.DISSOLVING
          slot.phaseStart = time
          slot.duration = rand(3, 4)
          tunedOut.push(i)
        }
      } else if (slot.phase === PHASE.DISSOLVING) {
        slot.reveal = Math.max(0, 1 - elapsed / slot.duration)
        if (elapsed >= slot.duration) this.reset(slot, time, rand(0.5, 2))
      }
    })
    return { tunedIn, tunedOut }
  }

  surface(slot, time) {
    const fragment = this.pick()
    const rect = this.place(fragment)
    if (!rect) {
      slot.phaseStart = time
      slot.duration = rand(0.5, 1.5)
      return
    }
    slot.fragment = fragment
    slot.rect = rect
    slot.phase = PHASE.SURFACING
    slot.phaseStart = time
    slot.duration = rand(3, 5)
    slot.reveal = 0
    this.draw(slot)
  }

  place(fragment, force = false) {
    const { width: W, height: H } = this.canvas
    if (!W || !H) return null
    const fontSize = Math.round(Math.min(26, Math.max(14, W * 0.011)))
    const lineHeight = Math.round(fontSize * 1.45)
    this.ctx.font = `400 ${fontSize}px 'IBM Plex Mono', ui-monospace, monospace`
    const maxWidth = Math.min(W * 0.42, fontSize * 30)
    const lines = wrap(this.ctx, fragment.text, maxWidth)
    const w = Math.ceil(
      Math.max(...lines.map((l) => this.ctx.measureText(l).width))
    )
    const h = lines.length * lineHeight
    const marginX = W * 0.05
    const marginY = H * 0.07
    const taken = this.slots.filter((s) => s.rect).map((s) => s.rect)
    let last = null
    for (let i = 0; i < 12; i++) {
      const x = rand(marginX, Math.max(marginX + 1, W - marginX - w))
      const y = rand(marginY, Math.max(marginY + 1, H - marginY - h))
      const candidate = { x, y, w, h, fontSize, lineHeight, lines }
      last = candidate
      if (!taken.some((r) => intersects(candidate, r, 24))) return candidate
    }
    // Tuning to a specific station must always land somewhere.
    return force ? last : null
  }

  // Summon a specific station into a slot (used by the tuner). Returns the slot
  // index so the caller can focus it, or -1 if there's no room.
  tuneTo(fragment, time) {
    let slot = this.slots.find((s) => s.phase === PHASE.EMPTY && !s.focused)
    if (!slot) {
      const free = this.slots
        .filter((s) => !s.focused)
        .sort((a, b) => a.phaseStart - b.phaseStart)
      slot = free[0]
    }
    if (!slot) return -1
    if (slot.rect) this.clearRect(slot.rect)
    slot.fragment = fragment
    const rect = this.place(fragment, true)
    if (!rect) return -1
    slot.rect = rect
    slot.phase = PHASE.SURFACING
    slot.phaseStart = time
    slot.duration = 1.0
    slot.reveal = 0
    slot.focused = false
    this.draw(slot)
    this.dirty = true
    return this.slots.indexOf(slot)
  }

  draw(slot) {
    const { rect } = slot
    const ctx = this.ctx
    ctx.font = `400 ${rect.fontSize}px 'IBM Plex Mono', ui-monospace, monospace`
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'top'
    rect.lines.forEach((line, i) => {
      ctx.fillText(line, rect.x, rect.y + i * rect.lineHeight)
    })
    this.dirty = true
  }

  rectUV(slot) {
    const { width: W, height: H } = this.canvas
    const r = slot.rect
    return [r.x / W, 1 - (r.y + r.h) / H, r.w / W, r.h / H]
  }

  hitTest(x, y, radius) {
    let best = -1
    let bestDist = radius
    this.slots.forEach((slot, i) => {
      if (!slot.rect || slot.reveal < 0.25) return
      const r = slot.rect
      const dx = Math.max(r.x - x, 0, x - (r.x + r.w))
      const dy = Math.max(r.y - y, 0, y - (r.y + r.h))
      const dist = Math.hypot(dx, dy)
      if (dist <= bestDist) {
        bestDist = dist
        best = i
      }
    })
    return best
  }

  focus(index) {
    const slot = this.slots[index]
    if (!slot || !slot.fragment) return null
    slot.focused = true
    slot.reveal = 1
    return slot.fragment
  }

  unfocus(index, time) {
    const slot = this.slots[index]
    if (!slot) return
    slot.focused = false
    slot.phase = PHASE.DISSOLVING
    slot.phaseStart = time
    slot.duration = rand(3, 4)
  }
}

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = attempt
    }
  }
  if (line) lines.push(line)
  return lines
}

function intersects(a, b, pad) {
  return (
    a.x - pad < b.x + b.w &&
    a.x + a.w + pad > b.x &&
    a.y - pad < b.y + b.h &&
    a.y + a.h + pad > b.y
  )
}
