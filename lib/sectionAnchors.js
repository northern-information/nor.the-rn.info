// Adds a § self-link to each heading inside an element with
// `data-section-anchors="h2,h3"` (the value lists the heading tags).
//
// The heading keeps its text, so search, feeds and excerpts do not see the §:
// CSS draws it with ::before (`.section-anchor` in tailwind.css). The link
// follows the heading in the DOM, so a screen reader hears the heading first,
// and CSS `order` shows it before the heading.

const ATTR = 'data-section-anchors'

const getText = (node) =>
  (node.content || [])
    .map((child) => (typeof child === 'string' ? child : getText(child)))
    .join('')

export function sectionAnchorsPlugin(eleventyConfig) {
  eleventyConfig.htmlTransformer.addPosthtmlPlugin(
    'html',
    () => (tree) => {
      tree.match({ attrs: { [ATTR]: /.+/ } }, (container) => {
        const tags = container.attrs[ATTR].split(',').map((tag) => tag.trim())
        delete container.attrs[ATTR]

        tree.match.call(
          container,
          tags.map((tag) => ({ tag })),
          (heading) => {
            // match() walks into the returned wrapper and finds the heading
            // again, so mark it to wrap it only once.
            const id = heading.attrs?.id
            if (!id || heading.anchored) return heading
            heading.anchored = true
            const label = getText(heading).replace(/\s+/g, ' ').trim()
            return {
              tag: 'div',
              attrs: { class: 'section-heading' },
              content: [
                heading,
                {
                  tag: 'a',
                  attrs: {
                    class: 'section-anchor',
                    href: `#${id}`,
                    'aria-label': `Link to section: ${label}`,
                  },
                },
              ],
            }
          }
        )
        return container
      })
      return tree
    },
    // Runs after IdAttributePlugin (no priority) assigns heading ids, and
    // before HtmlBasePlugin (-2).
    { priority: -1 }
  )
}
