function parseDuration(timeStr) {
  if (!timeStr) return undefined
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return undefined
}

async function initWebamp() {
  // Only run on pages with an explicit target (release pages)
  const target = document.getElementById('webamp-target')
  if (!target) return

  const audioElements = document.querySelectorAll('audio')
  if (audioElements.length === 0) return

  let Webamp
  try {
    const module = await import('https://unpkg.com/webamp@^2')
    Webamp = module.default
  } catch (err) {
    console.error('[webamp] import failed:', err)
    return
  }

  if (!Webamp.browserIsSupported()) return

  const tracks = []
  const audioEls = []

  audioElements.forEach((audio) => {
    const src = audio.src || audio.querySelector('source')?.src
    if (!src) return

    const title =
      audio.dataset.title ||
      document.querySelector('h1')?.textContent?.trim() ||
      'Unknown'
    const artist = audio.dataset.artist || ''
    const duration = parseDuration(audio.dataset.duration)

    tracks.push({
      url: src,
      metaData: { artist, title },
      ...(duration !== undefined && { duration }),
    })

    audioEls.push(audio)
  })

  if (tracks.length === 0) return

  const container = target

  try {
    const webamp = new Webamp({
      initialTracks: tracks,
      __initialWindowLayout: {
        main: { position: { top: 0, left: 0 } },
        equalizer: { position: { top: 116, left: 0 } },
        playlist: { position: { top: 232, left: 0 } },
      },
    })
    await webamp.renderWhenReady(container)

    // Move #webamp into our container if Webamp rendered it elsewhere
    const webampEl = document.querySelector('#webamp')
    if (webampEl && !container.contains(webampEl)) {
      container.appendChild(webampEl)
    }

    // Walk up from a window element to find the positioned wrapper
    function findTransformWrapper(el) {
      let node = el.parentElement
      while (node && node !== webampEl) {
        if (node.style.transform || node.style.position === 'absolute') return node
        node = node.parentElement
      }
      return el.parentElement
    }

    const windowPositions = [
      { id: 'main-window', top: '0px', left: '0px' },
      { id: 'equalizer-window', top: '116px', left: '0px' },
      { id: 'playlist-window', top: '232px', left: '0px' },
    ]

    function measureNativeHeight() {
      let maxBottom = 0
      for (const { id } of windowPositions) {
        const win = document.getElementById(id)
        if (!win) continue
        const wrapper = findTransformWrapper(win)
        if (wrapper) {
          const top = parseInt(wrapper.style.top, 10) || 0
          const height = win.offsetHeight || 0
          maxBottom = Math.max(maxBottom, top + height)
        }
      }
      return maxBottom || 348
    }

    function enforcePositions() {
      // Position the 3 known windows
      for (const { id, top, left } of windowPositions) {
        const win = document.getElementById(id)
        if (!win) continue
        const wrapper = findTransformWrapper(win)
        if (wrapper) {
          wrapper.style.setProperty('transform', 'none', 'important')
          wrapper.style.setProperty('top', top, 'important')
          wrapper.style.setProperty('left', left, 'important')
        }
      }

      // Force #webamp into document flow
      if (webampEl) {
        webampEl.style.setProperty('position', 'relative', 'important')
        webampEl.style.setProperty('top', 'auto', 'important')
        webampEl.style.setProperty('left', 'auto', 'important')

        const nativeHeight = measureNativeHeight()
        webampEl.style.setProperty('transform', 'none', 'important')
        webampEl.style.height = nativeHeight + 'px'

        container.style.height = nativeHeight + 'px'
        container.style.marginBottom = '1rem'
        container.style.overflow = 'hidden'
      }

      const desktop = document.querySelector('.webamp-desktop')
      if (desktop) desktop.style.setProperty('display', 'none', 'important')
    }

    enforcePositions()

    const observer = new MutationObserver(enforcePositions)
    observer.observe(webampEl || document.body, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
    })

    let frames = 0
    function frameLoop() {
      enforcePositions()
      if (++frames < 10) requestAnimationFrame(frameLoop)
    }
    requestAnimationFrame(frameLoop)

    window.addEventListener('resize', enforcePositions)

    webamp.onClose(() => {
      observer.disconnect()
      window.removeEventListener('resize', enforcePositions)
      container.style.height = ''
      container.style.marginBottom = ''
    })
  } catch (err) {
    console.error('[webamp-init] error:', err)
  }
}

initWebamp()
