// prettier.config.js, .prettierrc.js, prettier.config.mjs, or .prettierrc.mjs

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  plugins: ['@shopify/prettier-plugin-liquid'],
  overrides: [
    {
      files: ['*.liquid', '*.html', '*.md'],
      options: {
        singleQuote: false,
      },
    },
  ],
}

export default config
