export default {
  eleventyComputed: {
    projectGroups: (data) => {
      const projects = data.collections.projects || []
      return {
        featured: projects.filter((p) => p.featured),
        activeNotFeatured: projects.filter((p) => p.active && p.featured !== true),
        inactive: projects.filter((p) => !p.active),
      }
    },
  },
}
