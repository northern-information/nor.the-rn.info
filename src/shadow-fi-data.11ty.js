// SHADOW FI station index.
//
// Emits /shadow-fi.json — the flat list of "stations" the instrument tunes
// through. Built from the discography (which includes the `journal` anthology)
// and the projects collection. No blog posts: the ~233 generated release posts
// would duplicate the discography and drown the music, and prose posts can't be
// reliably told apart from them yet. Music radio first.
//
// Station kinds and weights (the picker leans hard toward the journal, the
// unreleased primary corpus):
//   journal  — one station per day of the `journal` anthology (2012–2017)
//   release  — one station per other release, carrying its playable tracks
//   project  — silent "dead air" idents between songs

const JOURNAL_SLUG = 'journal'

const WEIGHT = {
  journal: 6, // the primary corpus — most of the band is this
  release: 2,
  project: 1,
}

// Tints are normalized RGB for the shader, drawn from the NI palette:
// ember/amber for the journal, link-yellow for releases, active-red for
// projects. (index.js reads these straight into a uniform.)
const TINT = {
  journal: [0.98, 0.62, 0.24], // ember/amber — the lost ones
  release: [0.99, 0.86, 0.2], // link-yellow
  project: [0.94, 0.27, 0.27], // active-red
}

const mp3Tracks = (release) =>
  (release.tracks || [])
    .filter((t) => t.mp3_url)
    .map((t) => ({ title: t.title, audio: t.mp3_url, length: t.length }))

export default class ShadowFiData {
  data() {
    return {
      permalink: '/shadow-fi.json',
      eleventyExcludeFromCollections: true,
    }
  }

  render({ collections }) {
    const stations = []

    for (const release of collections.discography) {
      const url = `/music/${release.slug}` // slug already ends in "/"

      if (release.release_slug === JOURNAL_SLUG) {
        // Per-track: every day of the journal is its own station.
        for (const track of release.tracks || []) {
          if (!track.mp3_url) continue
          stations.push({
            id: track.id,
            kind: 'journal',
            title: track.title, // a date, e.g. "2013-11-07"
            date: track.title,
            url, // all days live on the journal release page
            length: track.length,
            audio: track.mp3_url,
          })
        }
        continue
      }

      // Per-release: one station carrying its streamable tracks.
      const tracks = mp3Tracks(release)
      stations.push({
        id: release.id,
        kind: 'release',
        title: release.title,
        date: release.released,
        url,
        tracks, // index.js picks one deterministically per station
      })
    }

    // Projects: silent idents — dead air between the songs.
    for (const project of collections.projects) {
      stations.push({
        id: `project-${project.slug}`,
        kind: 'project',
        title: project.name,
        date: '',
        url: `/project/${project.slug}/`,
      })
    }

    return JSON.stringify({ weights: WEIGHT, tints: TINT, stations })
  }
}
