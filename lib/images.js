import fs from 'node:fs'
import path from 'node:path'
import Image, { generateObject } from '@11ty/eleventy-img'

// Site images live in R2, not git. Originals go in src/images/ and their
// derivatives in src/img-optimized/; both directories are gitignored. The
// committed manifest holds the eleventy-img metadata for every <img>, so a
// build renders the <picture> markup without the source files.
//
// Workflow: add a file to src/images/, reference it as /images/<name>, then
// run `npm run images` to process, upload and update the manifest.

export const SOURCE_URL_PATH = '/images/'
export const OPTIMIZED_URL_PATH = '/img-optimized/'
export const SOURCE_DIR = 'src/images'
export const OPTIMIZED_DIR = 'src/img-optimized'
export const MANIFEST_PATH = 'images.manifest.json'

// The Worker serves /images/* and /img-optimized/* from these R2 keys.
export const R2 = {
  BUCKET: 'intertext',
  PREFIX: 'site',
  PUBLIC_URL: 'https://assets.the-rn.info/site',
}

// Keep these equal to the old eleventyImageTransformPlugin options. The
// derivative hashes do not depend on them, but the markup does.
export const IMAGE_OPTIONS = {
  formats: ['avif', 'webp', 'auto'],
  widths: [400, 800, 1600, 'auto'],
  outputDir: `./${OPTIMIZED_DIR}/`,
  urlPath: OPTIMIZED_URL_PATH,
  htmlOptions: {
    imgAttributes: {
      loading: 'lazy',
      decoding: 'async',
    },
  },
}

const ATTR_PREFIX = 'eleventy:'
const PICTURE_ATTR_PREFIX = `${ATTR_PREFIX}pictureattr:`

export function readManifest(root = process.cwd()) {
  const file = path.join(root, MANIFEST_PATH)
  if (!fs.existsSync(file)) return { originals: [], images: {} }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function writeManifest(manifest, root = process.cwd()) {
  const sorted = {
    originals: [...new Set(manifest.originals)].sort(),
    images: Object.fromEntries(
      Object.entries(manifest.images).sort(([a], [b]) => a.localeCompare(b))
    ),
  }
  fs.writeFileSync(
    path.join(root, MANIFEST_PATH),
    `${JSON.stringify(sorted, null, 2)}\n`
  )
}

// Every derivative URL in a manifest entry, e.g. /img-optimized/abc-400.webp.
export function getDerivativeUrls(metadata) {
  return Object.values(metadata).flatMap((entries) =>
    entries.map((entry) => entry.url)
  )
}

// Every file the manifest lists, with its R2 key and local path.
export function getManifestFiles(manifest, root = process.cwd()) {
  const urls = [
    ...manifest.originals.map((name) => `${SOURCE_URL_PATH}${name}`),
    ...new Set(Object.values(manifest.images).flatMap(getDerivativeUrls)),
  ]
  return urls.map((url) => {
    const isOriginal = url.startsWith(SOURCE_URL_PATH)
    const urlPath = isOriginal ? SOURCE_URL_PATH : OPTIMIZED_URL_PATH
    const dir = isOriginal ? SOURCE_DIR : OPTIMIZED_DIR
    return {
      url,
      isOriginal,
      key: `${R2.PREFIX}${url}`,
      file: path.join(root, dir, url.slice(urlPath.length)),
    }
  })
}

// Per-image overrides, as eleventy-img reads them from the <img> attributes.
function getInstanceOptions(attrs) {
  const options = {}
  if (attrs.width && String(attrs.width) === String(parseInt(attrs.width))) {
    options.widths = [parseInt(attrs.width, 10)]
  }
  if (attrs[`${ATTR_PREFIX}widths`]) {
    options.widths = attrs[`${ATTR_PREFIX}widths`]
      .split(',')
      .map((width) => parseInt(width, 10))
  }
  if (attrs[`${ATTR_PREFIX}formats`]) {
    options.formats = attrs[`${ATTR_PREFIX}formats`].split(',')
  }
  return options
}

// A manifest key is the source URL plus any per-image overrides, because
// the same file with other widths or formats has other derivatives.
function getManifestKey(src, instanceOptions) {
  const parts = [src]
  if (instanceOptions.widths) parts.push(`w=${instanceOptions.widths}`)
  if (instanceOptions.formats) parts.push(`f=${instanceOptions.formats}`)
  return parts.join('|')
}

const MIME_TYPES = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

// Store only what cannot be derived, so the manifest has no local paths.
function toManifestMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata).map(([format, entries]) => [
      format,
      entries.map(({ width, height, url }) => ({ width, height, url })),
    ])
  )
}

// Restore the fields generateObject reads.
function fromManifestMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata).map(([format, entries]) => [
      format,
      entries.map((entry) => ({
        ...entry,
        format,
        sourceType: MIME_TYPES[format],
        srcset: `${entry.url} ${entry.width}w`,
      })),
    ])
  )
}

function splitAttributes(attrs) {
  const imgAttrs = {}
  const pictureAttrs = {}
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith(PICTURE_ATTR_PREFIX)) {
      pictureAttrs[key.slice(PICTURE_ATTR_PREFIX.length)] = value
    } else if (!key.startsWith(ATTR_PREFIX)) {
      imgAttrs[key] = value
    }
  }
  if (attrs[`${ATTR_PREFIX}sizes`])
    imgAttrs.sizes = attrs[`${ATTR_PREFIX}sizes`]
  return { imgAttrs, pictureAttrs }
}

function toPosthtmlNode(obj) {
  const [tag] = Object.keys(obj)
  const { '@children': children, ...attrs } = obj[tag]
  return {
    tag,
    attrs,
    content: children?.filter(Boolean).map(toPosthtmlNode),
  }
}

function stripPrefixedAttributes(node) {
  for (const key of Object.keys(node.attrs || {})) {
    if (key.startsWith(ATTR_PREFIX)) delete node.attrs[key]
  }
}

/**
 * Replaces eleventyImageTransformPlugin. `process` is true for
 * `npm run images` and for the dev server: a local source file is then
 * processed with eleventy-img. A production build reads only the manifest
 * and fails when an image is not in it.
 */
export function imagesPlugin(
  eleventyConfig,
  { process: processLocal = false } = {}
) {
  const manifest = readManifest()
  const used = {}

  async function getMetadata(src, instanceOptions) {
    const key = getManifestKey(src, instanceOptions)
    const sourceFile = path.join(
      SOURCE_DIR,
      decodeURIComponent(src.slice(SOURCE_URL_PATH.length))
    )

    if (processLocal && fs.existsSync(sourceFile)) {
      const metadata = await Image(sourceFile, {
        ...IMAGE_OPTIONS,
        ...instanceOptions,
      })
      used[key] = toManifestMetadata(metadata)
    } else if (manifest.images[key]) {
      used[key] = manifest.images[key]
    } else {
      throw new Error(
        `${src} is not in ${MANIFEST_PATH}. Put the file in ${SOURCE_DIR}/ and run \`npm run images\`.`
      )
    }
    return used[key]
  }

  async function transform(node, targetNode) {
    const src = node.attrs?.src || ''
    if (src.startsWith('data:')) return stripPrefixedAttributes(node)
    if (!src.startsWith(SOURCE_URL_PATH)) {
      throw new Error(
        `<img src="${src}"> is not under ${SOURCE_URL_PATH}. Add eleventy:ignore to keep it as is.`
      )
    }

    const instanceOptions = getInstanceOptions(node.attrs)
    const metadata = await getMetadata(src, instanceOptions)
    const { imgAttrs, pictureAttrs } = splitAttributes(node.attrs)
    const newNode = toPosthtmlNode(
      generateObject(
        fromManifestMetadata(metadata),
        imgAttrs,
        pictureAttrs,
        IMAGE_OPTIONS
      )
    )

    // Same rule as eleventy-img: keep the attributes of an existing <picture>
    // only when the new root is a <picture> too.
    if (targetNode.tag !== newNode.tag) targetNode.attrs = {}
    targetNode.attrs = { ...targetNode.attrs, ...newNode.attrs }
    targetNode.tag = newNode.tag
    targetNode.content = newNode.content
  }

  const isIgnored = (node) => node.attrs?.[`${ATTR_PREFIX}ignore`] !== undefined

  eleventyConfig.htmlTransformer.addPosthtmlPlugin(
    'html',
    () => async (tree) => {
      const promises = []
      const handle = (imgNode, targetNode) => {
        if (isIgnored(imgNode)) stripPrefixedAttributes(imgNode)
        else promises.push(transform(imgNode, targetNode))
        return imgNode
      }

      tree.match({ tag: 'picture' }, (pictureNode) => {
        tree.match.call(pictureNode, { tag: 'img' }, (imgNode) => {
          imgNode.insideOfPicture = true
          return handle(imgNode, pictureNode)
        })
        return pictureNode
      })
      tree.match({ tag: 'img' }, (imgNode) => {
        if (imgNode.insideOfPicture) {
          delete imgNode.insideOfPicture
          return imgNode
        }
        return handle(imgNode, imgNode)
      })

      await Promise.all(promises)
      return tree
    },
    // Run before HtmlBasePlugin so src values are still unprefixed.
    { priority: -1 }
  )

  if (processLocal) {
    // Rewrite the manifest after a full build: every used entry plus every
    // original in src/images/. Entries that no page uses fall out.
    eleventyConfig.on('eleventy.after', ({ runMode }) => {
      if (runMode !== 'build') return
      const localOriginals = fs.existsSync(SOURCE_DIR)
        ? fs.readdirSync(SOURCE_DIR).filter((name) => !name.startsWith('.'))
        : []
      writeManifest({
        originals: [...manifest.originals, ...localOriginals],
        images: used,
      })
    })
  }
}
